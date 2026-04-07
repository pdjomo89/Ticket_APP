import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const clearAll = mutation({
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").collect();
    for (const ticket of tickets) {
      await ctx.db.delete(ticket._id);
    }
    // Reset ticketsSold on all events
    const events = await ctx.db.query("events").collect();
    for (const event of events) {
      await ctx.db.patch(event._id, { ticketsSold: 0 });
    }
    return `Deleted ${tickets.length} tickets`;
  },
});

export const createTicket = mutation({
  args: {
    ticketId: v.string(),
    eventId: v.string(),
    tierId: v.string(),
    tierName: v.string(),
    buyerName: v.string(),
    buyerEmail: v.string(),
    stripePaymentId: v.string(),
    qrCode: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tickets", {
      ticketId: args.ticketId,
      eventId: args.eventId,
      tierId: args.tierId,
      tierName: args.tierName,
      buyerName: args.buyerName,
      buyerEmail: args.buyerEmail,
      stripePaymentId: args.stripePaymentId,
      qrCode: args.qrCode,
      status: "valid",
    });
  },
});

export const getByStripePaymentId = query({
  args: { stripePaymentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_stripePaymentId", (q) =>
        q.eq("stripePaymentId", args.stripePaymentId)
      )
      .collect();
  },
});

export const getByTicketId = query({
  args: { ticketId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
      .first();
  },
});

export const validate = mutation({
  args: { ticketId: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticketId", (q) => q.eq("ticketId", args.ticketId))
      .first();

    if (!ticket) {
      return { valid: false, message: "Ticket not found", ticket: null };
    }

    const event = await ctx.db
      .query("events")
      .withIndex("by_eventId", (q) => q.eq("eventId", ticket.eventId))
      .first();

    if (ticket.status === "used") {
      return {
        valid: false,
        message: `Ticket already scanned at ${ticket.scannedAt}`,
        ticket: {
          id: ticket.ticketId,
          buyerName: ticket.buyerName,
          tierName: ticket.tierName,
          eventName: event?.name || "",
          status: ticket.status,
        },
      };
    }

    if (ticket.status === "cancelled") {
      return {
        valid: false,
        message: "Ticket has been cancelled",
        ticket: {
          id: ticket.ticketId,
          buyerName: ticket.buyerName,
          tierName: ticket.tierName,
          eventName: event?.name || "",
          status: ticket.status,
        },
      };
    }

    await ctx.db.patch(ticket._id, {
      status: "used",
      scannedAt: new Date().toISOString(),
    });

    return {
      valid: true,
      message: "Ticket is valid! Entry granted.",
      ticket: {
        id: ticket.ticketId,
        buyerName: ticket.buyerName,
        buyerEmail: ticket.buyerEmail,
        tierName: ticket.tierName,
        eventName: event?.name || "",
        eventDate: event?.date || "",
        eventVenue: event?.venue || "",
        status: "used",
      },
    };
  },
});

export const listAll = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tickets;

    if (args.status) {
      tickets = await ctx.db
        .query("tickets")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      tickets = await ctx.db.query("tickets").collect();
    }

    const events = await ctx.db.query("events").collect();
    const eventMap = new Map(events.map((e) => [e.eventId, e.name]));

    let result = tickets.map((t) => ({
      id: t.ticketId,
      event_id: t.eventId,
      event_name: eventMap.get(t.eventId) || "",
      tier_name: t.tierName,
      buyer_name: t.buyerName,
      buyer_email: t.buyerEmail,
      status: t.status,
      purchased_at: new Date(t._creationTime).toISOString(),
      scanned_at: t.scannedAt || null,
    }));

    if (args.search) {
      const s = args.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.buyer_name.toLowerCase().includes(s) ||
          t.buyer_email.toLowerCase().includes(s) ||
          t.id.toLowerCase().includes(s)
      );
    }

    result.sort((a, b) => b.purchased_at.localeCompare(a.purchased_at));

    return result;
  },
});

export const stats = query({
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").collect();
    const events = await ctx.db.query("events").collect();

    return {
      events: events.map((e) => ({
        id: e.eventId,
        name: e.name,
        tickets_available: e.ticketsAvailable,
        tickets_sold: e.ticketsSold,
      })),
      totals: {
        sold: tickets.length,
        checkedIn: tickets.filter((t) => t.status === "used").length,
        valid: tickets.filter((t) => t.status === "valid").length,
        cancelled: tickets.filter((t) => t.status === "cancelled").length,
      },
    };
  },
});
