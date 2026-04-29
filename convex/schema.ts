import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    eventId: v.string(),
    name: v.string(),
    description: v.string(),
    date: v.string(),
    venue: v.string(),
    time: v.optional(v.string()),
    ticketsAvailable: v.number(),
    ticketsSold: v.number(),
    imageUrl: v.optional(v.string()),
    tiers: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        price: v.number(), // in cents
        description: v.optional(v.string()),
      })
    ),
  }).index("by_eventId", ["eventId"]),

  tickets: defineTable({
    ticketId: v.string(),
    eventId: v.string(),
    tierId: v.string(),
    tierName: v.string(),
    buyerName: v.string(),
    buyerEmail: v.string(),
    stripePaymentId: v.optional(v.string()),
    qrCode: v.string(),
    status: v.string(), // "valid", "used", "cancelled"
    scannedAt: v.optional(v.string()),
  })
    .index("by_ticketId", ["ticketId"])
    .index("by_stripePaymentId", ["stripePaymentId"])
    .index("by_status", ["status"])
    .index("by_eventId", ["eventId"]),

  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.string(), // "super" | "admin"
  }).index("by_email", ["email"]),

  eventAdmins: defineTable({
    userId: v.id("users"),
    eventId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_eventId", ["eventId"])
    .index("by_userId_eventId", ["userId", "eventId"]),
});
