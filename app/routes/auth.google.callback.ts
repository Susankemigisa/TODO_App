import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getGoogleUser } from "../services/google.server";
import { db } from "../db.server";
import { createUserSession } from "../session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) return redirect("/login");

  try {
    const googleUser = await getGoogleUser(code);

    // Find existing user or create new one
    let user = await db.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.googleId },
          { email: googleUser.email },
        ],
      },
    });

    if (!user) {
      // New user — create account
      user = await db.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar,
          googleId: googleUser.googleId,
        },
      });
    } else if (!user.googleId) {
      // Existing email/password user — link their Google account
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.googleId, avatar: googleUser.avatar },
      });
    }

    return createUserSession(user.id, "/");
  } catch (error) {
    console.error("Google auth error:", error);
    return redirect("/login?error=google");
  }
}