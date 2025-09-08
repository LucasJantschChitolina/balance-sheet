import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all transactions
export const getAllTransactions = query({
	handler: async (ctx) => {
		return await ctx.db.query("transactions").collect();
	},
});

// Get transactions with entries
export const getTransactionsWithEntries = query({
	handler: async (ctx) => {
		const transactions = await ctx.db.query("transactions").collect();

		const transactionsWithEntries = await Promise.all(
			transactions.map(async (transaction) => {
				const entries = await ctx.db
					.query("transactionEntries")
					.withIndex("by_transaction", (q) => q.eq("transactionId", transaction._id))
					.collect();

				return {
					...transaction,
					entries,
				};
			})
		);

		return transactionsWithEntries;
	},
});

// Get transactions by date range
export const getTransactionsByDateRange = query({
	args: {
		startDate: v.string(),
		endDate: v.string(),
	},
	handler: async (ctx, args) => {
		const transactions = await ctx.db
			.query("transactions")
			.withIndex("by_date", (q) =>
				q.gte("date", args.startDate).lte("date", args.endDate)
			)
			.collect();

		const transactionsWithEntries = await Promise.all(
			transactions.map(async (transaction) => {
				const entries = await ctx.db
					.query("transactionEntries")
					.withIndex("by_transaction", (q) => q.eq("transactionId", transaction._id))
					.collect();

				return {
					...transaction,
					entries,
				};
			})
		);

		return transactionsWithEntries;
	},
});

// Create a new transaction with entries
export const createTransaction = mutation({
	args: {
		date: v.string(),
		description: v.optional(v.string()),
		reference: v.optional(v.string()),
		entries: v.array(v.object({
			accountId: v.id("accounts"),
			amount: v.number(),
			type: v.union(v.literal("debit"), v.literal("credit")),
			description: v.optional(v.string()),
		})),
	},
	handler: async (ctx, args) => {
		// Validate that debits equal credits
		const totalDebits = args.entries
			.filter(entry => entry.type === "debit")
			.reduce((sum, entry) => sum + entry.amount, 0);

		const totalCredits = args.entries
			.filter(entry => entry.type === "credit")
			.reduce((sum, entry) => sum + entry.amount, 0);

		const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Allow for small rounding differences

		if (!isBalanced) {
			throw new Error("Transaction must be balanced (debits must equal credits)");
		}

		// Create transaction
		const transactionId = await ctx.db.insert("transactions", {
			date: args.date,
			description: args.description,
			reference: args.reference,
			totalAmount: totalDebits, // Use debit total as reference
			isBalanced,
		});

		// Create transaction entries
		for (const entry of args.entries) {
			await ctx.db.insert("transactionEntries", {
				transactionId,
				accountId: entry.accountId,
				amount: entry.amount,
				type: entry.type,
				description: entry.description,
			});
		}

		return transactionId;
	},
});

// Update transaction
export const updateTransaction = mutation({
	args: {
		id: v.id("transactions"),
		date: v.string(),
		description: v.optional(v.string()),
		reference: v.optional(v.string()),
		entries: v.array(v.object({
			accountId: v.id("accounts"),
			amount: v.number(),
			type: v.union(v.literal("debit"), v.literal("credit")),
			description: v.optional(v.string()),
		})),
	},
	handler: async (ctx, args) => {
		// Validate that debits equal credits
		const totalDebits = args.entries
			.filter(entry => entry.type === "debit")
			.reduce((sum, entry) => sum + entry.amount, 0);

		const totalCredits = args.entries
			.filter(entry => entry.type === "credit")
			.reduce((sum, entry) => sum + entry.amount, 0);

		const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

		if (!isBalanced) {
			throw new Error("Transaction must be balanced (debits must equal credits)");
		}

		// Update transaction
		await ctx.db.patch(args.id, {
			date: args.date,
			description: args.description,
			reference: args.reference,
			totalAmount: totalDebits,
			isBalanced,
		});

		// Delete existing entries
		const existingEntries = await ctx.db
			.query("transactionEntries")
			.withIndex("by_transaction", (q) => q.eq("transactionId", args.id))
			.collect();

		for (const entry of existingEntries) {
			await ctx.db.delete(entry._id);
		}

		// Create new entries
		for (const entry of args.entries) {
			await ctx.db.insert("transactionEntries", {
				transactionId: args.id,
				accountId: entry.accountId,
				amount: entry.amount,
				type: entry.type,
				description: entry.description,
			});
		}

		return args.id;
	},
});

// Delete transaction
export const deleteTransaction = mutation({
	args: {
		id: v.id("transactions"),
	},
	handler: async (ctx, args) => {
		// Delete all entries first
		const entries = await ctx.db
			.query("transactionEntries")
			.withIndex("by_transaction", (q) => q.eq("transactionId", args.id))
			.collect();

		for (const entry of entries) {
			await ctx.db.delete(entry._id);
		}

		// Delete transaction
		await ctx.db.delete(args.id);

		return { success: true };
	},
});

// Get account balance based on transactions
export const getAccountBalance = query({
	args: {
		accountId: v.id("accounts"),
		asOfDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// First get all transaction entries for this account
		let entries = await ctx.db
			.query("transactionEntries")
			.withIndex("by_account", (q) => q.eq("accountId", args.accountId))
			.collect();

		// If asOfDate is provided, filter entries by transaction date
		if (args.asOfDate) {
			// Get all transactions up to the specified date
			const asOfDate = args.asOfDate;
			const transactionsUpToDate = await ctx.db
				.query("transactions")
				.filter((q) => q.lte(q.field("date"), asOfDate))
				.collect();

			const transactionIds = new Set(transactionsUpToDate.map(t => t._id));

			// Filter entries to only include transactions up to the specified date
			entries = entries.filter(entry => transactionIds.has(entry.transactionId));
		}

		let balance = 0;
		for (const entry of entries) {
			if (entry.type === "debit") {
				balance += entry.amount;
			} else {
				balance -= entry.amount;
			}
		}

		return balance;
	},
});
