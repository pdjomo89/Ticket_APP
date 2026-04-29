import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export const COOKIE_NAME = "tkt_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  userId: Id<"users">;
  role: "super" | "admin";
  email: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (
      typeof payload.userId === "string" &&
      (payload.role === "super" || payload.role === "admin") &&
      typeof payload.email === "string"
    ) {
      return {
        userId: payload.userId as Id<"users">,
        role: payload.role,
        email: payload.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Response("Unauthorized", { status: 401 });
  return session;
}

export async function requireSuper(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "super") throw new Response("Forbidden", { status: 403 });
  return session;
}

export function convex() {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

export async function permittedEventIds(session: SessionPayload): Promise<string[] | "all"> {
  if (session.role === "super") return "all";
  const ids = await convex().query(api.users.listEventIds, { userId: session.userId });
  return ids;
}
