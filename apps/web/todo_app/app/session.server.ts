import { createCookieSessionStorage, redirect } from "react-router";

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

export async function createUserSession(
  userId: string,
  accessToken: string,
  redirectTo: string,
) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  session.set("accessToken", accessToken);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function getAccessToken(request: Request) {
  const session = await getUserSession(request);
  const token = session.get("accessToken");
  if (!token || typeof token !== "string") return null;
  return token;
}

export async function requireAccessToken(request: Request) {
  const token = await getAccessToken(request);
  if (!token) throw redirect("/login");
  return token;
}

export async function requireUserId(request: Request) {
  const userId = await getUserId(request);
  if (!userId) throw redirect("/login");
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  const { apiFetch } = await import("./utils/api.server");
  const token = await getAccessToken(request);
  if (!token) return null;
  try {
    return await apiFetch(`/auth/me`, token);
  } catch {
    return null;
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}