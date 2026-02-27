import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    replyToMessageId: v.optional(v.id("messages")),
    forwardedFrom: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Validate content
    if (!args.content.trim() || args.content.length > 1000) {
      throw new Error("Invalid message content")
    }

    // Verify user is conversation member
    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.senderId).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!member) {
      throw new Error("User not in conversation")
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content.trim(),
      isDeleted: false,
      reactions: [],
      ...(args.replyToMessageId ? { replyToMessageId: args.replyToMessageId } : {}),
      ...(args.forwardedFrom ? { forwardedFrom: args.forwardedFrom } : {}),
    })

    // Update conversation lastMessageTime
    await ctx.db.patch(args.conversationId, {
      lastMessageTime: Date.now(),
    })

    return messageId
  },
})

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30

    // Get read horizons for other members to determine isRead
    const otherMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.neq(q.field("userId"), args.userId))
      .collect()

    const readHorizons = await Promise.all(
      otherMembers.map(async (m) => {
        if (!m.lastSeenMessageId) return 0
        const msg = await ctx.db.get(m.lastSeenMessageId)
        return msg ? msg._creationTime : 0
      })
    )

    // In group, everyone must read it for blue ticks (min). In 1-on-1, it's just the other person.
    const minReadHorizon = readHorizons.length > 0 ? Math.min(...readHorizons) : 0

    let query = ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")

    if (args.cursor) {
      query = query.filter((q) => q.lt(q.field("_creationTime"), parseInt(args.cursor!)))
    }

    // Fetch a bit more to account for hidden messages, then filter
    // In a real app with many hidden messages, a while loop or an index change is better
    const rawMessages = await query.take((limit + 1) * 2)

    // Load hidden message IDs for this user
    const hiddenRecords = await ctx.db
      .query("hiddenMessages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
    const hiddenSet = new Set(hiddenRecords.map((h) => h.messageId))

    const messages = rawMessages.filter((msg) => !hiddenSet.has(msg._id))

    const hasMore = messages.length > limit
    const messagesToReturn = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? messagesToReturn[messagesToReturn.length - 1]._creationTime.toString() : null

    const messagesWithSender = await Promise.all(
      messagesToReturn.reverse().map(async (message) => {
        const sender = await ctx.db.get(message.senderId)

        let replyToMessageWithSender = undefined
        if (message.replyToMessageId) {
          const replyTo = await ctx.db.get(message.replyToMessageId)
          if (replyTo && !hiddenSet.has(replyTo._id)) {
            const replySender = await ctx.db.get(replyTo.senderId)
            if (replySender) {
              replyToMessageWithSender = { ...replyTo, sender: replySender }
            }
          }
        }

        return {
          ...message,
          sender,
          replyToMessage: replyToMessageWithSender,
          isRead: message._creationTime <= minReadHorizon,
        }
      })
    )

    return {
      messages: messagesWithSender,
      nextCursor,
      hasMore
    }
  },
})

export const getUnreadCount = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!member || !member.lastSeenMessageId) {
      // Count all messages if never read
      const count = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
        .collect()
      return count.length
    }

    const lastSeenMessage = await ctx.db.get(member.lastSeenMessageId)
    if (!lastSeenMessage) return 0

    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gt(q.field("_creationTime"), lastSeenMessage._creationTime))
      .collect()

    return unreadMessages.length
  },
})

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error("Message not found")
    }

    if (message.senderId !== args.userId) {
      throw new Error("Unauthorized: You can only delete your own messages")
    }

    if (Date.now() - message._creationTime > 60 * 60 * 1000) {
      throw new Error("Message can only be deleted within 1 hour")
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      content: "This message was deleted",
    })
  },
})

export const deleteForMe = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Hidden messages are stored logically
    const existing = await ctx.db
      .query("hiddenMessages")
      .withIndex("by_user_and_message", (q) =>
        q.eq("userId", args.userId).eq("messageId", args.messageId)
      )
      .unique()

    if (!existing) {
      await ctx.db.insert("hiddenMessages", {
        userId: args.userId,
        messageId: args.messageId,
      })
    }
  },
})

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.content.trim() || args.content.length > 1000) {
      throw new Error("Invalid message content")
    }

    const message = await ctx.db.get(args.messageId)

    if (!message || message.senderId !== args.userId) {
      throw new Error("Unauthorized")
    }

    if (Date.now() - message._creationTime > 5 * 60 * 1000) {
      throw new Error("Message can only be edited within 5 minutes")
    }

    await ctx.db.patch(args.messageId, {
      content: args.content.trim(),
      editedAt: Date.now(),
    })
  },
})

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error("Message not found")
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId === args.userId && r.emoji === args.emoji
    )

    let newReactions
    if (existingReactionIndex !== -1) {
      // Remove reaction
      newReactions = message.reactions.filter((_, i) => i !== existingReactionIndex)
    } else {
      // Add reaction
      newReactions = [...message.reactions, { emoji: args.emoji, userId: args.userId }]
    }

    await ctx.db.patch(args.messageId, {
      reactions: newReactions,
    })
  },
})

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(1)

    const lastMessage = messages[0]

    if (!lastMessage) return

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique()

    if (member) {
      await ctx.db.patch(member._id, {
        lastSeenMessageId: lastMessage._id,
      })
    }
  },
})
