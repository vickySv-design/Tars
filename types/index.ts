import { Id } from "@/convex/_generated/dataModel"

export type User = {
  _id: Id<"users">
  _creationTime: number
  clerkId: string
  name: string
  email: string
  imageUrl: string
  isOnline: boolean
  lastSeen: number
}

export type Conversation = {
  _id: Id<"conversations">
  _creationTime: number
  isGroup: boolean
  groupName?: string
  members: Id<"users">[]
  lastMessageAt: number
}

export type Message = {
  _id: Id<"messages">
  _creationTime: number
  conversationId: Id<"conversations">
  senderId: Id<"users">
  content: string
  isDeleted: boolean
  replyToMessageId?: Id<"messages">
  editedAt?: number
  forwardedFrom?: Id<"users">
  reactions: MessageReaction[]
}

export type MessageReaction = {
  emoji: string
  userId: Id<"users">
}

export type ConversationMember = {
  _id: Id<"conversationMembers">
  _creationTime: number
  conversationId: Id<"conversations">
  userId: Id<"users">
  lastSeenMessageId?: Id<"messages">
}

export type TypingStatus = {
  _id: Id<"typingStatus">
  _creationTime: number
  conversationId: Id<"conversations">
  userId: Id<"users">
  lastTypingAt: number
}

export type ConversationWithDetails = Conversation & {
  otherUser?: User
  lastMessage?: Message
  unreadCount: number
}

export type MessageWithSender = Message & {
  sender: User
  replyToMessage?: MessageWithSender
  isRead?: boolean
}

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"] as const
export type ReactionEmoji = string
