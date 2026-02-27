import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

export const getOrCreateConversation = mutation({
  args: {
    currentUserId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Sort user IDs for consistent lookup
    const sortedUserIds = [args.currentUserId, args.otherUserId].sort()

    // Find existing conversation between these two users
    const existingMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", sortedUserIds[0]))
      .collect()

    for (const member of existingMembers) {
      const conversation = await ctx.db.get(member.conversationId)
      if (!conversation || conversation.isGroup) continue

      // Check if other user is also in this conversation
      const otherMember = await ctx.db
        .query("conversationMembers")
        .withIndex("by_user_and_conversation", (q) =>
          q.eq("userId", sortedUserIds[1]).eq("conversationId", member.conversationId)
        )
        .unique()

      if (otherMember) {
        return member.conversationId
      }
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: false,
      lastMessageTime: Date.now(),
    })

    // Create conversation members
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.currentUserId,
    })

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.otherUserId,
    })

    return conversationId
  },
})

export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    const conversationsWithDetails = await Promise.all(
      userMembers.map(async (member) => {
        const conv = await ctx.db.get(member.conversationId)
        if (!conv) return null

        // Get other user for 1-on-1 chats
        let otherUser = null
        if (!conv.isGroup) {
          const otherMember = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
            .filter((q) => q.neq(q.field("userId"), args.userId))
            .unique()

          if (otherMember) {
            otherUser = await ctx.db.get(otherMember.userId)
          }
        }

        // Get last message
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .take(1)

        const lastMessage = messages[0] || null

        // Get unread count
        let unreadCount = 0
        if (!member.lastSeenMessageId) {
          // Count all messages if never read
          const allMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
            .collect()
          unreadCount = allMessages.length
        } else {
          const lastSeenMessage = await ctx.db.get(member.lastSeenMessageId)
          if (lastSeenMessage) {
            const unreadMessages = await ctx.db
              .query("messages")
              .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
              .filter((q) => q.gt(q.field("_creationTime"), lastSeenMessage._creationTime))
              .collect()
            unreadCount = unreadMessages.length
          }
        }

        // Get group members for group chats
        let groupMembers: any[] = []
        if (conv.isGroup) {
          const members = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
            .collect()

          groupMembers = await Promise.all(
            members.map(async (member) => {
              const user = await ctx.db.get(member.userId)
              return user
            })
          )
        }

        return {
          ...conv,
          otherUser,
          groupMembers,
          lastMessage,
          unreadCount,
        }
      })
    )

    return conversationsWithDetails
      .filter(Boolean)
      .sort((a, b) => (b?.lastMessageTime || 0) - (a?.lastMessageTime || 0))
  },
})

export const createGroupConversation = mutation({
  args: {
    creatorId: v.id("users"),
    memberIds: v.array(v.id("users")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Create group conversation
    const conversationId = await ctx.db.insert("conversations", {
      isGroup: true,
      name: args.name,
      lastMessageTime: Date.now(),
    })

    // Add all members including creator
    const allMemberIds = [args.creatorId, ...args.memberIds]
    await Promise.all(
      allMemberIds.map((userId) =>
        ctx.db.insert("conversationMembers", {
          conversationId,
          userId,
        })
      )
    )

    return conversationId
  },
})

export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.id("users")
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) return null

    // Get other user for 1-on-1 chats
    let otherUser = null
    if (!conversation.isGroup) {
      const otherMember = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
        .filter((q) => q.neq(q.field("userId"), args.currentUserId))
        .unique()

      if (otherMember) {
        otherUser = await ctx.db.get(otherMember.userId)
      }
    }

    return {
      ...conversation,
      otherUser
    }
  },
})
