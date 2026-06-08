import { Form, useActionData, redirect } from "react-router";
import { useState } from "react";
import { db } from "../db.server";
import { createUserSession } from "../session.server";
import bcrypt from "bcryptjs";
import type { Route } from "./+types/signup";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  if (password !== confirm) {
    return { error: "Passwords do not match" };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { name, email, password: hashedPassword },
  });

  return createUserSession(user.id, "/");
}

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap",
    },
  ];
}

function PasswordInput({ id, name, placeholder }: { id: string; name: string; placeholder: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className="field-input"
        style={{ paddingRight: "40px" }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        title={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

export default function Signup() {
  const actionData = useActionData<typeof action>();

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-page:      #F5F2EC;
          --bg-card:      #FFFFFF;
          --bg-banner:    #111111;
          --bg-input:     #F9F7F3;
          --text-primary: #111111;
          --text-muted:   #999999;
          --text-faint:   #CCCCCC;
          --border:       #E8E3DA;
          --border-focus: #C9A96E;
          --gold:         #C9A96E;
          --gold-glow:    rgba(201,169,110,0.15);
          --btn-bg:       #111111;
          --btn-hover:    #2a2a2a;
          --shadow-card:  0 4px 8px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.09);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg-page:      #0E0E0E;
            --bg-card:      #1A1A1A;
            --bg-banner:    #000000;
            --bg-input:     #242424;
            --text-primary: #F0EDE7;
            --text-muted:   #999999;
            --text-faint:   #808080;
            --border:       #2E2E2E;
            --border-focus: #C9A96E;
            --gold:         #C9A96E;
            --gold-glow:    rgba(201,169,110,0.12);
            --btn-bg:       #F0EDE7;
            --btn-hover:    #FFFFFF;
            --shadow-card:  0 4px 8px rgba(0,0,0,0.3), 0 24px 64px rgba(0,0,0,0.5);
          }
        }

        body {
          background: var(--bg-page);
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .card {
          width: 100%;
          max-width: 460px;
          background: var(--bg-card);
          border-radius: 24px;
          box-shadow: var(--shadow-card);
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .banner {
          background: var(--bg-banner);
          padding: 36px 44px 28px;
        }

        .banner-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.22em;
          text-transform: uppercase; color: #555; margin-bottom: 8px;
        }

        .banner-title {
          font-family: 'DM Serif Display', serif;
          font-size: 36px; color: #fff; line-height: 1.05;
        }

        .banner-title em { font-style: italic; color: var(--gold); }

        .body { padding: 36px 44px 44px; }

        .fields { display: flex; flex-direction: column; gap: 20px; }

        .field-label {
          display: block; font-size: 11px; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 8px;
        }

        .field-input {
          width: 100%; border: 1.5px solid var(--border); border-radius: 12px;
          padding: 13px 17px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 400; color: var(--text-primary);
          background: var(--bg-input); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .field-input::placeholder { color: var(--text-faint); }

        .field-input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--gold-glow);
          background: var(--bg-card);
        }

        .error {
          background: rgba(220,38,38,0.08);
          border: 1px solid rgba(220,38,38,0.2);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #DC2626;
        }

        .submit-btn {
          width: 100%;
          background: var(--btn-bg);
          color: var(--bg-card);
          border: none;
          border-radius: 12px;
          padding: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: background 0.2s, transform 0.1s;
          margin-top: 8px;
        }

        .submit-btn:hover { background: var(--btn-hover); }
        .submit-btn:active { transform: scale(0.98); }

        .footer-link {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: var(--text-muted);
        }

        .footer-link a {
          color: var(--gold);
          font-weight: 600;
          text-decoration: none;
        }

        .footer-link a:hover { text-decoration: underline; }
      `}</style>

      <div className="page">
        <div className="card">
          <div className="banner">
            <p className="banner-label">Get Started</p>
            <h1 className="banner-title">Create <em>Account</em></h1>
          </div>

          <div className="body">
            <Form method="post">
              <div className="fields">
                {actionData?.error && (
                  <div className="error">{actionData.error}</div>
                )}

                <div>
                  <label className="field-label" htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    className="field-input"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="field-input"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="password">Password</label>
                  <PasswordInput id="password" name="password" placeholder="At least 6 characters" />
                </div>

                <div>
                  <label className="field-label" htmlFor="confirm">Confirm Password</label>
                  <PasswordInput id="confirm" name="confirm" placeholder="Repeat your password" />
                </div>

                <button type="submit" className="submit-btn">
                  Create Account
                </button>
              </div>
            </Form>

            <p className="footer-link">
              Already have an account?{" "}
              <a href="/login">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}