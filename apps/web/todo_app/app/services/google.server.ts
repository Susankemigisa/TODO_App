import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// Generate the URL that sends user to Google's login page
export function getGoogleAuthUrl() {
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile"],
    prompt: "select_account",
  });
}

// Exchange the code Google sends back for user profile info
export async function getGoogleUser(code: string) {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload()!;

  return {
    googleId: payload.sub,
    email: payload.email!,
    name: payload.name!,
    avatar: payload.picture,
  };
}