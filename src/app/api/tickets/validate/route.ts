import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { convex, getSession, permittedEventIds } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketId, eventId } = await req.json();
  if (!ticketId || typeof ticketId !== "string") {
    return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
  }

  const allowed = await permittedEventIds(session);
  if (eventId) {
    if (allowed !== "all" && !allowed.includes(eventId)) {
      return NextResponse.json({ error: "Forbidden for this event" }, { status: 403 });
    }
  }

  const result = await convex().mutation(api.tickets.validate, {
    ticketId,
    eventId: typeof eventId === "string" ? eventId : undefined,
  });
  return NextResponse.json(result);
}
