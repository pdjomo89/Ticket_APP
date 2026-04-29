import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { convex, getSession } from "@/lib/session";

async function requireSuper() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.role !== "super") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function POST(req: NextRequest) {
  const auth = await requireSuper();
  if (auth.error) return auth.error;

  const body = await req.json();
  const {
    eventId,
    name,
    description,
    date,
    time,
    venue,
    ticketsAvailable,
    imageUrl,
    tiers,
  } = body;

  if (
    typeof eventId !== "string" ||
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof date !== "string" ||
    typeof venue !== "string" ||
    typeof ticketsAvailable !== "number" ||
    !Array.isArray(tiers) ||
    tiers.length === 0
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await convex().mutation(api.events.create, {
      eventId,
      name,
      description,
      date,
      time: typeof time === "string" ? time : undefined,
      venue,
      ticketsAvailable,
      imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
      tiers,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
