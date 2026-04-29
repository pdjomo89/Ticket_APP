import { NextRequest, NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { verifyPassword, hashPassword } from "@/lib/password";
import { convex, signSession, setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const c = convex();
  let user = await c.query(api.users.getByEmail, { email });

  // Bootstrap super-admin from env on first login
  if (!user && process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD) {
    if (
      email.toLowerCase() === process.env.SUPER_ADMIN_EMAIL.toLowerCase() &&
      password === process.env.SUPER_ADMIN_PASSWORD
    ) {
      const passwordHash = await hashPassword(password);
      await c.mutation(api.users.create, {
        email,
        passwordHash,
        name: "Super Admin",
        role: "super",
      });
      user = await c.query(api.users.getByEmail, { email });
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signSession({
    userId: user._id,
    role: user.role === "super" ? "super" : "admin",
    email: user.email,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    success: true,
    user: { email: user.email, name: user.name, role: user.role },
  });
}
