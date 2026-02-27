import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastSeen: Date.now(),
      })
      return existingUser._id
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      isOnline: true,
      lastSeen: Date.now(),
    })

    return userId
  },
})

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()
  },
})

export const getAllUsers = query({
  args: { currentUserId: v.id("users") },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect()
    return users.filter((user) => user._id !== args.currentUserId)
  },
})

export const updateHeartbeat = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: true,
      lastSeen: Date.now(),
    })
  },
})

export const setOnlineStatus = mutation({
  args: {
    userId: v.id("users"),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    })
  },
})

export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
      })
      return existingUser._id
    }

    return null
  },
})
export const markOfflineUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - 60000 // 60 seconds
    const staleUsers = await ctx.db
      .query("users")
      .filter((q) => q.and(
        q.eq(q.field("isOnline"), true),
        q.lt(q.field("lastSeen"), cutoffTime)
      ))
      .collect()

    await Promise.all(
      staleUsers.map((user) =>
        ctx.db.patch(user._id, { isOnline: false })
      )
    )
  },
})
