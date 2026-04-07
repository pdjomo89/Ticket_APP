import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
  }

  const { eventId, buyerName, buyerEmail, quantity: qtyStr, tierId, tierName } = session.metadata || {};
  if (!eventId || !buyerName || !buyerEmail) {
    return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
  }

  const quantity = parseInt(qtyStr || "1", 10);
  const paymentId = session.payment_intent as string;

  let tickets = await convex.query(api.tickets.getByStripePaymentId, {
    stripePaymentId: paymentId,
  });

  if (tickets.length === 0) {
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

    tickets = await convex.query(api.tickets.getByStripePaymentId, {
      stripePaymentId: paymentId,
    });
  }

  const event = await convex.query(api.events.getByEventId, { eventId });

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      id: t.ticketId,
      buyerName: t.buyerName,
      buyerEmail: t.buyerEmail,
      tierName: t.tierName,
      qrCode: t.qrCode,
      status: t.status,
    })),
    event: {
      name: event?.name || "",
      date: event?.date || "",
      venue: event?.venue || "",
    },
  });
}
