import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

export const list = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const links = await ctx.db.query("eventAdmins").collect();
    const eventIdsByUser = new Map<string, string[]>();
    for (const link of links) {
      const arr = eventIdsByUser.get(link.userId) ?? [];
      arr.push(link.eventId);
      eventIdsByUser.set(link.userId, arr);
    }
    return users.map((u) => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      eventIds: eventIdsByUser.get(u._id) ?? [],
      createdAt: new Date(u._creationTime).toISOString(),
    }));
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) throw new Error("A user with this email already exists");
    return await ctx.db.insert("users", {
      email,
      passwordHash: args.passwordHash,
      name: args.name,
      role: args.role,
    });
  },
});

export const updatePassword = mutation({
  args: { userId: v.id("users"), passwordHash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { passwordHash: args.passwordHash });
  },
});

export const remove = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("eventAdmins")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    for (const link of links) await ctx.db.delete(link._id);
    await ctx.db.delete(args.userId);
  },
});

export const listEventIds = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("eventAdmins")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return links.map((l) => l.eventId);
  },
});

export const grantEvent = mutation({
  args: { userId: v.id("users"), eventId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("eventAdmins")
      .withIndex("by_userId_eventId", (q) =>
        q.eq("userId", args.userId).eq("eventId", args.eventId)
      )
      .first();
    if (existing) return;
    await ctx.db.insert("eventAdmins", {
      userId: args.userId,
      eventId: args.eventId,
    });
  },
});

export const revokeEvent = mutation({
  args: { userId: v.id("users"), eventId: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("eventAdmins")
      .withIndex("by_userId_eventId", (q) =>
        q.eq("userId", args.userId).eq("eventId", args.eventId)
      )
      .first();
    if (link) await ctx.db.delete(link._id);
  },
});
