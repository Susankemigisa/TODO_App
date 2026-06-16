import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export async function sendPasswordResetEmail(email: string, code: string, name: string) {
  const resend = getResend();
  await resend.emails.send({
    from: "TODO App <onboarding@resend.dev>",
    to: email,
    subject: "Your password reset code",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Reset your password</h1>
        <p style="color: #666; margin-bottom: 32px;">Hi ${name}, here is your 6-digit reset code. It expires in 15 minutes.</p>
        <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #111;">${code}</span>
        </div>
        <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}