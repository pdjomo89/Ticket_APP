import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { convex, getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const c = convex();
  const user = await c.query(api.users.getById, { userId: session.userId });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const eventIds =
    user.role === "super"
      ? []
      : await c.query(api.users.listEventIds, { userId: session.userId });

  return NextResponse.json({
    email: user.email,
    name: user.name,
    role: user.role,
    eventIds,
  });
}
