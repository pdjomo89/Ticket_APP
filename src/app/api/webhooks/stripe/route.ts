import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { eventId, buyerName, buyerEmail, quantity: qtyStr, tierId, tierName } = session.metadata || {};
    const quantity = parseInt(qtyStr || "1", 10);

    if (eventId && buyerName && buyerEmail) {
      const paymentId = session.payment_intent as string;

      for (let i = 0; i < quantity; i++) {
        const ticketId = `tkt_${uuidv4()}`;
        const qrData = JSON.stringify({ ticketId, eventId });
        const qrCode = await QRCode.toDataURL(qrData);

        await convex.mutation(api.tickets.createTicket, {
          ticketId,
          eventId,
          tierId: tierId || "standard",
          tierName: tierName || "Standard",
          buyerName,
          buyerEmail,
          stripePaymentId: paymentId,
          qrCode,
        });
      }

      await convex.mutation(api.events.incrementTicketsSold, {
        eventId,
        quantity,
      });
    }
  }

  return NextResponse.json({ received: true });
}
