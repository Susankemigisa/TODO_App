import { createCookieSessionStorage, redirect } from "react-router";
import { db } from "./db.server";

// ── SESSION STORAGE ──
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: ["super-secret-key-change-in-production"],
    secure: process.env.NODE_ENV === "production",
  },
});

// ── SAVE USER ID IN SESSION ──
export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

// ── GET SESSION ──
export async function getUserSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

// ── GET LOGGED IN USER ID ──
export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

// ── GET LOGGED IN USER (full object) ──
export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  return (db as any).user.findUnique({ where: { id: userId } });
}

// ── REQUIRE USER — redirect to login if not logged in ──
export async function requireUserId(request: Request) {
  const userId = await getUserId(request);
  if (!userId) throw redirect("/login");
  return userId;
}

// ── LOG OUT ──
export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}