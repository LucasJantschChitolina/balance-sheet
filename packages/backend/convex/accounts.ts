import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAllAccounts = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("accounts").collect();
	},
});

export const getAccountsByType = query({
	args: { type: v.union(v.literal("asset"), v.literal("liability"), v.literal("equity")) },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("accounts")
			.withIndex("by_type", (q) => q.eq("type", args.type))
			.collect();
	},
});

export const getActiveAccounts = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("accounts")
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();
	},
});

export const createAccount = mutation({
	args: {
		name: v.string(),
		code: v.string(),
		type: v.union(v.literal("asset"), v.literal("liability"), v.literal("equity")),
		parentId: v.optional(v.id("accounts")),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existingAccount = await ctx.db
			.query("accounts")
			.filter((q) => q.eq(q.field("code"), args.code))
			.first();

		if (existingAccount) {
			throw new Error(`Account with code ${args.code} already exists`);
		}

		const accountId = await ctx.db.insert("accounts", {
			name: args.name,
			code: args.code,
			type: args.type,
			parentId: args.parentId,
			isActive: true,
			description: args.description,
		});

		return accountId;
	},
});

export const updateAccount = mutation({
	args: {
		id: v.id("accounts"),
		name: v.optional(v.string()),
		code: v.optional(v.string()),
		parentId: v.optional(v.id("accounts")),
		isActive: v.optional(v.boolean()),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;

		if (updates.code) {
			const existingAccount = await ctx.db
				.query("accounts")
				.filter((q) =>
					q.and(
						q.eq(q.field("code"), updates.code),
						q.neq(q.field("_id"), id)
					)
				)
				.first();

			if (existingAccount) {
				throw new Error(`Account with code ${updates.code} already exists`);
			}
		}

		await ctx.db.patch(id, updates);
		return id;
	},
});

export const deleteAccount = mutation({
	args: { id: v.id("accounts") },
	handler: async (ctx, args) => {
		const childAccounts = await ctx.db
			.query("accounts")
			.withIndex("by_parent", (q) => q.eq("parentId", args.id))
			.collect();

		if (childAccounts.length > 0) {
			throw new Error("Cannot delete account with child accounts. Please delete child accounts first.");
		}

		const transactionEntries = await ctx.db
			.query("transactionEntries")
			.withIndex("by_account", (q) => q.eq("accountId", args.id))
			.collect();

		if (transactionEntries.length > 0) {
			throw new Error("Cannot delete account that has been used in transactions. You can deactivate it instead.");
		}

		await ctx.db.delete(args.id);
		return args.id;
	},
});

export const toggleAccountStatus = mutation({
	args: { id: v.id("accounts") },
	handler: async (ctx, args) => {
		const account = await ctx.db.get(args.id);
		if (!account) {
			throw new Error("Account not found");
		}

		await ctx.db.patch(args.id, { isActive: !account.isActive });
		return args.id;
	},
});
