import { Form, useActionData } from "react-router";
import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { db } from "../db.server";
import { sendPasswordResetEmail } from "../services/email.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) return { error: "Email is required", success: false };

  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return { success: true, error: null };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const passwordReset = (db as any).passwordReset;

  await passwordReset.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  await passwordReset.create({
    data: { userId: user.id, code, expiresAt },
  });

  await sendPasswordResetEmail(user.email, code, user.name);

  return redirect(`/reset-password?email=${encodeURIComponent(email)}`);
}

export function links() {
  return [
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" },
  ];
}

export default function ForgotPassword() {
  const actionData = useActionData<{ error?: string | null; success?: boolean }>();

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
        .banner-label { font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #555; margin-bottom: 8px; }
        .banner-title { font-family: 'DM Serif Display', serif; font-size: 36px; color: #fff; line-height: 1.05; }
        .banner-title em { font-style: italic; color: var(--gold); }
        .body { padding: 36px 44px 44px; }
        .subtitle { font-size: 14px; color: var(--text-muted); margin-bottom: 28px; line-height: 1.6; }
        .field-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
        .field-input { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 13px 17px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text-primary); background: var(--bg-input); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .field-input::placeholder { color: var(--text-faint); }
        .field-input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--gold-glow); background: var(--bg-card); }
        .submit-btn { width: 100%; background: var(--btn-bg); color: var(--bg-card); border: none; border-radius: 12px; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; margin-top: 20px; }
        .submit-btn:hover { background: var(--btn-hover); }
        .alert-error { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: #DC2626; margin-bottom: 20px; }
        .alert-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: #16A34A; margin-bottom: 20px; }
        .footer-link { text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted); }
        .footer-link a { color: var(--gold); font-weight: 600; text-decoration: none; }
        .footer-link a:hover { text-decoration: underline; }
      `}</style>
      <div className="page">
        <div className="card">
          <div className="banner">
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "6px" }}>
              <svg width="40" height="40" viewBox="0 0 80 80" fill="none">
                <polygon points="40,4 72,40 40,76 8,40" fill="none" stroke="#C9A96E" strokeWidth="2.5"/>
                <polygon points="40,18 58,40 40,62 22,40" fill="#C9A96E" opacity="0.12"/>
              </svg>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", fontStyle: "italic", color: "#C9A96E" }}>Tasks</span>
            </div>
            <p className="banner-label">Password Reset</p>
            <h1 className="banner-title">Forgot <em>Password?</em></h1>
          </div>
          <div className="body">
            <p className="subtitle">Enter your email and we'll send you a 6-digit code to reset your password. The code expires in 15 minutes.</p>
            {actionData?.error && <div className="alert-error">{actionData.error}</div>}
            {actionData?.success && <div className="alert-success">If that email exists, a reset code has been sent!</div>}
            <Form method="post">
              <label className="field-label" htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" className="field-input" placeholder="you@example.com" autoFocus required />
              <button type="submit" className="submit-btn">Send reset code</button>
            </Form>
            <p className="footer-link"><a href="/login">← Back to Sign In</a></p>
          </div>
        </div>
      </div>
    </>
  );
}