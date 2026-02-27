import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_last_seen", ["lastSeen"]),

  conversations: defineTable({
    isGroup: v.boolean(),
    name: v.optional(v.string()),
    lastMessageTime: v.number(),
  })
    .index("by_last_message_time", ["lastMessageTime"]),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastSeenMessageId: v.optional(v.id("messages")),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_user_and_conversation", ["userId", "conversationId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    isDeleted: v.boolean(),
    replyToMessageId: v.optional(v.id("messages")),
    editedAt: v.optional(v.number()),
    forwardedFrom: v.optional(v.id("users")),
    reactions: v.array(
      v.object({
        emoji: v.string(),
        userId: v.id("users"),
      })
    ),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"])
    .index("by_conversation_time", ["conversationId", "_creationTime"]),

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastTyped: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user_and_conversation", ["userId", "conversationId"]),

  hiddenMessages: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_message", ["messageId"])
    .index("by_user_and_message", ["userId", "messageId"]),
})
