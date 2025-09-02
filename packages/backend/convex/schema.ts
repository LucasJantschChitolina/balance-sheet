import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	accounts: defineTable({
		name: v.string(),
		code: v.string(),
		type: v.union(v.literal("asset"), v.literal("liability"), v.literal("equity")),
		parentId: v.optional(v.id("accounts")),
		isActive: v.boolean(),
		description: v.optional(v.string()),
	}).index("by_type", ["type"]).index("by_parent", ["parentId"]),

	transactions: defineTable({
		date: v.string(), // ISO date string
		description: v.optional(v.string()),
		reference: v.optional(v.string()), // Invoice number, check number, etc.
		totalAmount: v.number(), // For quick reference
		isBalanced: v.boolean(), // Validation flag
	}).index("by_date", ["date"]),

	// Transaction entries (debit/credit lines)
	transactionEntries: defineTable({
		transactionId: v.id("transactions"),
		accountId: v.id("accounts"),
		amount: v.number(),
		type: v.union(v.literal("debit"), v.literal("credit")),
		description: v.optional(v.string()),
	}).index("by_transaction", ["transactionId"]).index("by_account", ["accountId"]),
});
