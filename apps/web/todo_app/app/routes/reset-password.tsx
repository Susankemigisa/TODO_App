import { Form, useActionData, useSearchParams } from "react-router";
import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { db } from "../db.server";
import bcrypt from "bcryptjs";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const intent = formData.get("intent") as string;

  // RESEND CODE
  if (intent === "resend") {
    const { sendPasswordResetEmail } = await import("../services/email.server");
    const user = await db.user.findUnique({ where: { email } });
    if (user && user.password) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await (db as any).passwordReset.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
      await (db as any).passwordReset.create({ data: { userId: user.id, code, expiresAt } });
      await sendPasswordResetEmail(user.email, code, user.name);
    }
    return { resent: true, error: null };
  }

  // RESET PASSWORD
  const code = formData.get("code") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!code || code.length !== 6) return { error: "Please enter the 6-digit code", resent: false };
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters", resent: false };
  if (password !== confirmPassword) return { error: "Passwords do not match", resent: false };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid request", resent: false };

  const reset = await (db as any).passwordReset.findFirst({
    where: { userId: user.id, code, used: false, expiresAt: { gt: new Date() } },
  });

  if (!reset) return { error: "Invalid or expired code. Click 'Resend code' to get a new one.", resent: false };

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
  await (db as any).passwordReset.update({ where: { id: reset.id }, data: { used: true } });

  return redirect("/login?reset=success");
}

export function links() {
  return [
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" },
  ];
}

export default function ResetPassword() {
  const actionData = useActionData<{ error?: string | null; resent?: boolean }>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-page: #F5F2EC; --bg-card: #FFFFFF; --bg-banner: #111111; --bg-input: #F9F7F3;
          --text-primary: #111111; --text-muted: #999999; --text-faint: #CCCCCC;
          --border: #E8E3DA; --border-focus: #C9A96E; --gold: #C9A96E;
          --gold-glow: rgba(201,169,110,0.15); --btn-bg: #111111; --btn-hover: #2a2a2a;
          --shadow-card: 0 4px 8px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.09);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg-page: #0E0E0E; --bg-card: #1A1A1A; --bg-banner: #000000; --bg-input: #242424;
            --text-primary: #F0EDE7; --text-muted: #999999; --text-faint: #808080;
            --border: #2E2E2E; --border-focus: #C9A96E; --gold: #C9A96E;
            --gold-glow: rgba(201,169,110,0.12); --btn-bg: #F0EDE7; --btn-hover: #FFFFFF;
            --shadow-card: 0 4px 8px rgba(0,0,0,0.3), 0 24px 64px rgba(0,0,0,0.5);
          }
        }
        body { background: var(--bg-page); font-family: 'DM Sans', sans-serif; color: var(--text-primary); min-height: 100vh; }
        .page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; }
        .card { width: 100%; max-width: 460px; background: var(--bg-card); border-radius: 24px; box-shadow: var(--shadow-card); overflow: hidden; border: 1px solid var(--border); }
        .banner { background: var(--bg-banner); padding: 36px 44px 28px; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8c8c8c; text-decoration: none; margin-bottom: 20px; transition: color 0.15s; }
        .back-link:hover { color: #b3b3b3; }
        .banner-label { font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #555; margin-bottom: 8px; }
        .banner-title { font-family: 'DM Serif Display', serif; font-size: 36px; color: #fff; line-height: 1.05; }
        .banner-title em { font-style: italic; color: var(--gold); }
        .body { padding: 36px 44px 44px; }
        .subtitle { font-size: 14px; color: var(--text-muted); margin-bottom: 28px; line-height: 1.6; }
        .email-highlight { color: var(--gold); font-weight: 600; }
        .fields { display: flex; flex-direction: column; gap: 20px; }
        .field-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
        .field-input { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 13px 17px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text-primary); background: var(--bg-input); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .field-input::placeholder { color: var(--text-faint); }
        .field-input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--gold-glow); background: var(--bg-card); }
        .code-input { text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 10px; }
        .submit-btn { width: 100%; background: var(--btn-bg); color: var(--bg-card); border: none; border-radius: 12px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .submit-btn:hover { background: var(--btn-hover); }
        .resend-btn { width: 100%; background: transparent; border: 1.5px solid var(--border); border-radius: 12px; padding: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: border-color 0.2s, color 0.2s; margin-top: 10px; }
        .resend-btn:hover { border-color: var(--gold); color: var(--gold); }
        .alert-error { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: #DC2626; margin-bottom: 20px; }
        .alert-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: #16A34A; margin-bottom: 20px; }
      `}</style>
      <div className="page">
        <div className="card">
          <div className="banner">
            <a href="/forgot-password" className="back-link">← Back</a>
            <p className="banner-label">Password Reset</p>
            <h1 className="banner-title">New <em>Password</em></h1>
          </div>
          <div className="body">
            <p className="subtitle">
              Enter the 6-digit code sent to <span className="email-highlight">{email}</span> and choose a new password.
            </p>
            {actionData?.error && <div className="alert-error">{actionData.error}</div>}
            {actionData?.resent && <div className="alert-success">A new code has been sent to your email!</div>}
            <Form method="post">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="intent" value="reset" />
              <div className="fields">
                <div>
                  <label className="field-label" htmlFor="code">6-digit code</label>
                  <input id="code" name="code" type="text" className="field-input code-input" placeholder="000000" maxLength={6} autoFocus required />
                </div>
                <div>
                  <label className="field-label" htmlFor="password">New password</label>
                  <input id="password" name="password" type="password" className="field-input" placeholder="Min. 8 characters" required />
                </div>
                <div>
                  <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
                  <input id="confirmPassword" name="confirmPassword" type="password" className="field-input" placeholder="Repeat new password" required />
                </div>
                <button type="submit" className="submit-btn">Reset password</button>
              </div>
            </Form>

            {/* Resend code — separate form so it doesn't validate the other fields */}
            <Form method="post">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="intent" value="resend" />
              <button type="submit" className="resend-btn">Resend code</button>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}