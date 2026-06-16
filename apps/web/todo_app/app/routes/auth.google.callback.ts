import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getGoogleUser } from "../services/google.server";
import { createUserSession } from "../session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return redirect("/login");

  try {
    const googleUser = await getGoogleUser(code);

    const API_URL = process.env.API_URL ?? "http://localhost:3001";
    const res = await fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(googleUser),
    });

    if (!res.ok) throw new Error("Google auth failed");

    const result = await res.json();
    return createUserSession(result.user.id, result.access_token, "/");
  } catch (error) {
    console.error("Google auth error:", error);
    return redirect("/login?error=google");
  }
}