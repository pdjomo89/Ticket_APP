import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { convex, getSession, permittedEventIds } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await permittedEventIds(session);
  const stats = await convex().query(api.tickets.stats, {
    eventIds: allowed === "all" ? undefined : allowed,
  });
  return NextResponse.json(stats);
}
