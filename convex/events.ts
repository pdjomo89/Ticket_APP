import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();
    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  },
});

export const getByEventId = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
  },
});

export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("events").first();
    if (existing) return "Events already seeded";

    await ctx.db.insert("events", {
      eventId: "evt_004",
      name: "Grand Barbecue de Québec 2026",
      description:
        "Venez profiter d'une journée festive autour du barbecue à Québec! Grillades, musique, activités pour toute la famille et une ambiance chaleureuse vous attendent.",
      date: "2026-07-11T10:00:00",
      time: "9:00 AM – 3:00 PM",
      venue: "Parc Victoria — 160 Rue du Cardinal-Maurice-Roy, Québec, QC G1K 8W5",
      ticketsAvailable: 300,
      ticketsSold: 0,
      imageUrl: "/images/bbq-ambiance-acte-2-2026.jpeg",
      tiers: [
        {
          id: "standard",
          name: "Standard",
          price: 3000,
        },
      ],
    });

    await ctx.db.insert("events", {
      eventId: "evt_005",
      name: "Nighty Gala Party",
      description:
        "An elegant evening of fine dining, live music, and dancing. Dress to impress for an unforgettable night of glamour and celebration.",
      date: "2026-07-11T19:00:00",
      time: "7:00 PM – 1:00 AM",
      venue: "TBA",
      ticketsAvailable: 200,
      ticketsSold: 0,
      imageUrl: "/images/nighty-gala-2026.png",
      tiers: [
        {
          id: "single",
          name: "Single",
          price: 5000,
          description: "One entry pass",
        },
        {
          id: "couple-vip",
          name: "Couple VIP",
          price: 9000,
          description: "Two entry passes with VIP access",
        },
      ],
    });

    return "Seeded successfully";
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.string(),
    time: v.optional(v.string()),
    venue: v.optional(v.string()),
    date: v.optional(v.string()),
    ticketsAvailable: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (!event) throw new Error("Event not found");

    const updates: Record<string, string | number> = {};
    if (args.time !== undefined) updates.time = args.time;
    if (args.venue !== undefined) updates.venue = args.venue;
    if (args.date !== undefined) updates.date = args.date;
    if (args.ticketsAvailable !== undefined) updates.ticketsAvailable = args.ticketsAvailable;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;

    await ctx.db.patch(event._id, updates);
  },
});

export const create = mutation({
  args: {
    eventId: v.string(),
    name: v.string(),
    description: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    venue: v.string(),
    ticketsAvailable: v.number(),
    imageUrl: v.optional(v.string()),
    tiers: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        price: v.number(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (existing) throw new Error("An event with this ID already exists");
    await ctx.db.insert("events", {
      eventId: args.eventId,
      name: args.name,
      description: args.description,
      date: args.date,
      time: args.time,
      venue: args.venue,
      ticketsAvailable: args.ticketsAvailable,
      ticketsSold: 0,
      imageUrl: args.imageUrl,
      tiers: args.tiers,
    });
  },
});

export const resetEventCounters = mutation({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (!event) throw new Error("Event not found");

    await ctx.db.patch(event._id, { ticketsSold: 0 });

    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    let resetCount = 0;
    for (const t of tickets) {
      if (t.status === "used" || t.scannedAt !== undefined) {
        await ctx.db.patch(t._id, { status: "valid", scannedAt: undefined });
        resetCount++;
      }
    }

    return { ticketsSoldReset: true, scannedTicketsReset: resetCount };
  },
});

export const incrementTicketsSold = mutation({
  args: { eventId: v.string(), quantity: v.number() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (!event) throw new Error("Event not found");

    await ctx.db.patch(event._id, {
      ticketsSold: event.ticketsSold + args.quantity,
    });
  },
});
