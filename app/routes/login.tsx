import { Form, useActionData } from "react-router";
import { useState } from "react";
import { db } from "../db.server";
import { createUserSession } from "../session.server";
import bcrypt from "bcryptjs";
import type { Route } from "./+types/login";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const user = await (db as any).user.findUnique({ where: { email } });
  if (!user) {
    return { error: "No account found with that email" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "Incorrect password" };
  }

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

export default function Login() {
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

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .divider-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-faint);
        }

        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 13px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .google-btn:hover {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--gold-glow);
            }

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
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "6px" }}>
              <svg width="40" height="40" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="40,4 72,40 40,76 8,40" fill="none" stroke="#C9A96E" strokeWidth="2.5"/>
                <line x1="8" y1="40" x2="72" y2="40" stroke="#C9A96E" strokeWidth="1" opacity="0.35"/>
                <line x1="40" y1="4" x2="40" y2="76" stroke="#C9A96E" strokeWidth="1" opacity="0.35"/>
                <line x1="8" y1="40" x2="40" y2="4" stroke="#C9A96E" strokeWidth="0.8" opacity="0.2"/>
                <line x1="72" y1="40" x2="40" y2="4" stroke="#C9A96E" strokeWidth="0.8" opacity="0.2"/>
                <polygon points="40,18 58,40 40,62 22,40" fill="#C9A96E" opacity="0.12"/>
              </svg>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", fontStyle: "italic", color: "#C9A96E" }}>Tasks</span>
            </div>
            <p className="banner-label">Welcome Back</p>
            <h1 className="banner-title">Sign <em>In</em></h1>
          </div>

          <div className="body">
            <Form method="post">
              <div className="fields">
                {actionData?.error && (
                  <div className="error">{actionData.error}</div>
                )}

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
                  <PasswordInput id="password" name="password" placeholder="Your password" />
                  <a href="/forgot-password" className="forgot-password-link">
                    Forgot your password?
                  </a>
                </div>

                <button type="submit" className="submit-btn">
                  Sign In
                </button>

                <div className="divider">
                  <div className="divider-line" />
                  <span className="divider-text">or</span>
                  <div className="divider-line" />
                </div>

                <a href="/auth/google" className="google-btn">
                    <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.2-10.1 7.2-17z"/>
                        <path fill="#FBBC05" d="M10.5 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z"/>
                        <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.2 0-11.5-4.2-13.4-9.8l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
                    </svg>
                    Continue with Google
                    </a>

              </div>
            </Form>

            <p className="footer-link">
              Don't have an account?{" "}
              <a href="/signup">Create one</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}