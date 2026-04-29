import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { convex, getSession, permittedEventIds } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const status = req.nextUrl.searchParams.get("status") || "";

  const allowed = await permittedEventIds(session);
  const tickets = await convex().query(api.tickets.listAll, {
    search: search || undefined,
    status: status || undefined,
    eventIds: allowed === "all" ? undefined : allowed,
  });

  return NextResponse.json({ tickets });
}
