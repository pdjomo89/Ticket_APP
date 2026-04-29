import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { convex, getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";

async function requireSuper() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.role !== "super") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const auth = await requireSuper();
  if (auth.error) return auth.error;

  const users = await convex().query(api.users.list, {});
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireSuper();
  if (auth.error) return auth.error;

  const { email, name, password, role, eventIds } = await req.json();

  if (
    typeof email !== "string" ||
    typeof name !== "string" ||
    typeof password !== "string" ||
    !email ||
    !name ||
    password.length < 8
  ) {
    return NextResponse.json(
      { error: "Email, name, and password (min 8 chars) required" },
      { status: 400 }
    );
  }

  const userRole = role === "super" ? "super" : "admin";
  const c = convex();
  const passwordHash = await hashPassword(password);

  try {
    const userId = await c.mutation(api.users.create, {
      email,
      name,
      passwordHash,
      role: userRole,
    });

    if (Array.isArray(eventIds)) {
      for (const eventId of eventIds) {
        if (typeof eventId === "string") {
          await c.mutation(api.users.grantEvent, { userId, eventId });
        }
      }
    }

    return NextResponse.json({ success: true, userId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
