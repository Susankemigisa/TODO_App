import { Form, useActionData } from "react-router";
import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { db } from "../db.server";
import { sendPasswordResetEmail } from "../services/email.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) return { error: "Email is required" };

  const user = await db.user.findUnique({ where: { email } });

  // Don't reveal if email exists or not for security
  if (!user || !user.password) {
    return { success: true };
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const passwordResetModel =
    (db as any).passwordReset ??
    (db as any).passwordResetToken ??
    (db as any).passwordResetRequest;

  if (!passwordResetModel) {
    throw new Error("Password reset model is not available on the Prisma client");
  }

  // Invalidate any existing codes
  await passwordResetModel.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  // Save new code
  await passwordResetModel.create({
    data: { userId: user.id, code, expiresAt },
  });

  await sendPasswordResetEmail(user.email, code, user.name);

  return redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

export default function ForgotPassword() {
  const actionData = useActionData<{ error?: string; success?: boolean }>();

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0E0E0E; font-family: 'DM Sans', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .card { background: #1A1A1A; border: 1px solid #2E2E2E; border-radius: 24px; padding: 40px; width: min(100%, 420px); }
        .title { font-size: 24px; font-weight: 700; color: #F0EDE7; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #999; margin-bottom: 32px; line-height: 1.6; }
        .label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #999; margin-bottom: 6px; }
        .input { width: 100%; border: 1.5px solid #2E2E2E; border-radius: 12px; padding: 13px 17px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #F0EDE7; background: #242424; outline: none; transition: border-color 0.2s; margin-bottom: 16px; }
        .input:focus { border-color: #C9A96E; box-shadow: 0 0 0 3px rgba(201,169,110,0.15); }
        .btn { width: 100%; background: #F0EDE7; color: #111; border: none; border-radius: 12px; padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .btn:hover { background: #fff; }
        .error { color: #DC2626; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        .success { color: #16A34A; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        .back { display: block; text-align: center; margin-top: 20px; font-size: 13px; color: #999; text-decoration: none; }
        .back:hover { color: #F0EDE7; }
      `}</style>
      <div className="card">
        <h1 className="title">Forgot password?</h1>
        <p className="subtitle">Enter your email and we'll send you a 6-digit code to reset your password.</p>
        {actionData?.error && <p className="error">{actionData.error}</p>}
        {actionData?.success && <p className="success">If that email exists, a code has been sent!</p>}
        <Form method="post">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" placeholder="you@example.com" required />
          <button type="submit" className="btn">Send reset code</button>
        </Form>
        <a href="/login" className="back">← Back to login</a>
      </div>
    </>
  );
}