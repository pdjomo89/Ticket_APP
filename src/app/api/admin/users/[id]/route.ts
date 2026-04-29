import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuper();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { password } = await req.json();

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 chars" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await convex().mutation(api.users.updatePassword, {
    userId: id as Id<"users">,
    passwordHash,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuper();
  if (auth.error) return auth.error;

  const { id } = await params;
  if (auth.session.userId === id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await convex().mutation(api.users.remove, { userId: id as Id<"users"> });
  return NextResponse.json({ success: true });
}
