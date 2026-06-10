import { Form, useActionData, useSearchParams } from "react-router";
import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { db } from "../db.server";
import bcrypt from "bcryptjs";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const code = formData.get("code") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!code || code.length !== 6) return { error: "Please enter the 6-digit code" };
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters" };
  if (password !== confirmPassword) return { error: "Passwords do not match" };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid request" };

  // Find valid code
  const reset = await (db as any).resetPassword.findFirst({
    where: {
      userId: user.id,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!reset) return { error: "Invalid or expired code. Please request a new one." };

  // Hash new password and update user
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  // Mark code as used
  await (db as any).resetPassword.update({
    where: { id: reset.id },
    data: { used: true },
  });

  return redirect("/login?reset=success");
}

export default function ResetPassword() {
  const actionData = useActionData<{ error?: string }>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

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
        .code-input { text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 12px; }
        .btn { width: 100%; background: #F0EDE7; color: #111; border: none; border-radius: 12px; padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .btn:hover { background: #fff; }
        .error { color: #DC2626; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        .back { display: block; text-align: center; margin-top: 20px; font-size: 13px; color: #999; text-decoration: none; }
        .back:hover { color: #F0EDE7; }
        .hint { font-size: 12px; color: #666; margin-top: -10px; margin-bottom: 16px; }
      `}</style>
      <div className="card">
        <h1 className="title">Reset password</h1>
        <p className="subtitle">Enter the 6-digit code we sent to <strong style={{color: "#C9A96E"}}>{email}</strong> and choose a new password.</p>
        {actionData?.error && <p className="error">{actionData.error}</p>}
        <Form method="post">
          <input type="hidden" name="email" value={email} />
          <label className="label" htmlFor="code">6-digit code</label>
          <input id="code" name="code" type="text" className="input code-input" placeholder="000000" maxLength={6} required />
          <label className="label" htmlFor="password">New password</label>
          <input id="password" name="password" type="password" className="input" placeholder="Min. 8 characters" required />
          <label className="label" htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" className="input" placeholder="Repeat new password" required />
          <button type="submit" className="btn">Reset password</button>
        </Form>
        <a href="/forgot-password" className="back">← Request a new code</a>
      </div>
    </>
  );
}