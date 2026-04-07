import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { eventId, buyerName, buyerEmail, quantity = 1, tierId, tierName, tierPrice } = await req.json();

  if (!eventId || !buyerName || !buyerEmail || !tierId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (quantity < 1 || quantity > 10) {
    return NextResponse.json({ error: "Quantity must be between 1 and 10" }, { status: 400 });
  }

  const event = await convex.query(api.events.getByEventId, { eventId });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const tier = event.tiers.find((t) => t.id === tierId);
  if (!tier) {
    return NextResponse.json({ error: "Ticket tier not found" }, { status: 404 });
  }

  const remaining = event.ticketsAvailable - event.ticketsSold;
  if (quantity > remaining) {
    return NextResponse.json({ error: `Only ${remaining} tickets remaining` }, { status: 400 });
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : req.headers.get("origin") || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: `${event.name} — ${tier.name}`,
            description: tier.description || `${event.date} at ${event.venue}`,
          },
          unit_amount: tier.price,
        },
        quantity,
      },
    ],
    mode: "payment",
    success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/events`,
    metadata: {
      eventId,
      buyerName,
      buyerEmail,
      quantity: String(quantity),
      tierId: tier.id,
      tierName: tier.name,
    },
  });

  return NextResponse.json({ sessionId: session.id, url: session.url });
}
