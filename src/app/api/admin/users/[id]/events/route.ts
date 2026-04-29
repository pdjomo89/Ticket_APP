import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { convex, getSession } from "@/lib/session";

async function requireSuper() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.role !== "super") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuper();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { eventId } = await req.json();
  if (typeof eventId !== "string" || !eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  await convex().mutation(api.users.grantEvent, {
    userId: id as Id<"users">,
    eventId,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuper();
  if (auth.error) return auth.error;

  const { id } = await params;
  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  await convex().mutation(api.users.revokeEvent, {
    userId: id as Id<"users">,
    eventId,
  });
  return NextResponse.json({ success: true });
}
