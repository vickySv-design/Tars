import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const updateTypingStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique()

    const lastTyped = args.isTyping === false ? 0 : Date.now()

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastTyped,
      })
    } else {
      await ctx.db.insert("typingStatus", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastTyped,
      })
    }
  },
})

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const typingStatuses = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()

    const now = Date.now()
    const TYPING_TIMEOUT = 2000 // 2 seconds

    const activeTypingUsers = await Promise.all(
      typingStatuses
        .filter(
          (status) =>
            status.userId !== args.currentUserId &&
            now - status.lastTyped < TYPING_TIMEOUT
        )
        .map(async (status) => {
          const user = await ctx.db.get(status.userId)
          return user
        })
    )

    return activeTypingUsers.filter((user) => user !== null)
  },
})
