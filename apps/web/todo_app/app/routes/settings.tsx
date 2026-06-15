import { Form, useLoaderData, useActionData } from "react-router";
import { redirect } from "react-router";
import { db } from "../db.server";
import { requireUserId, logout } from "../session.server";
import type { Route } from "./+types/settings";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw redirect("/login");
  return { user };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update-profile") {
    const name = (formData.get("name") as string)?.trim();
    const avatar = (formData.get("avatar") as string)?.trim();
    if (!name) return { error: "Name cannot be empty", success: null };
    await db.user.update({ where: { id: userId }, data: { name, avatar: avatar || null } });
    return { success: "Profile updated successfully!", error: null };
  }

  if (intent === "delete-account") {
    await db.user.delete({ where: { id: userId } });
    return logout(request);
  }

  return { error: null, success: null };
}

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap",
    },
  ];
}

export default function Settings() {
  const { user } = useLoaderData<typeof loader>();
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

        body { background: var(--bg-page); font-family: 'DM Sans', sans-serif; color: var(--text-primary); min-height: 100vh; }

        .page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 60px 20px 80px; }

        .card { width: 100%; max-width: 580px; background: var(--bg-card); border-radius: 24px; box-shadow: var(--shadow-card); overflow: hidden; border: 1px solid var(--border); }

        .banner { background: var(--bg-banner); padding: 38px 44px 32px; }

        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8c8c8c; text-decoration: none; margin-bottom: 20px; transition: color 0.15s; }
        .back-link:hover { color: #b3b3b3; }

        .banner-label { font-size: 10px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #b3b3b3; margin-bottom: 8px; }

        .banner-title { font-family: 'DM Serif Display', serif; font-size: 38px; color: #fff; line-height: 1.05; }
        .banner-title em { font-style: italic; color: var(--gold); }

        .avatar-row { display: flex; align-items: center; gap: 18px; margin-top: 24px; }

        .avatar-img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #333; }

        .avatar-placeholder { width: 56px; height: 56px; border-radius: 50%; background: #222; border: 2px solid #333; display: flex; align-items: center; justify-content: center; font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--gold); }

        .avatar-info { display: flex; flex-direction: column; gap: 2px; }
        .avatar-name { font-size: 15px; font-weight: 600; color: #fff; }
        .avatar-email { font-size: 12px; color: #555; }

        .avatar-badge { margin-top: 4px; display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); background: rgba(201,169,110,0.1); border: 1px solid rgba(201,169,110,0.2); padding: 2px 8px; border-radius: 99px; }

        .body { padding: 0; }

        .section { padding: 28px 44px; border-bottom: 1px solid var(--border); }
        .section:last-child { border-bottom: none; }

        .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 20px; }

        .fields { display: flex; flex-direction: column; gap: 16px; }

        .field-label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 7px; }

        .field-input { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 16px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--text-primary); background: var(--bg-input); outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .field-input::placeholder { color: var(--text-faint); }
        .field-input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--gold-glow); background: var(--bg-card); }

        .alert-success { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: #16A34A; margin-bottom: 16px; }
        .alert-error { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2); border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: #DC2626; margin-bottom: 16px; }

        .save-btn { background: var(--btn-bg); color: var(--bg-card); border: none; border-radius: 12px; padding: 12px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s; margin-top: 4px; }
        .save-btn:hover { background: var(--btn-hover); }

        .reset-password-box { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border: 1.5px solid var(--border); border-radius: 12px; background: var(--bg-input); }
        .reset-password-info { display: flex; flex-direction: column; gap: 3px; }
        .reset-password-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .reset-password-hint { font-size: 12px; color: var(--text-muted); }
        .reset-password-link { font-size: 13px; font-weight: 700; color: var(--gold); text-decoration: none; white-space: nowrap; transition: opacity 0.15s; }
        .reset-password-link:hover { opacity: 0.75; }

        .logout-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: var(--text-primary); cursor: pointer; transition: background 0.15s; width: 100%; justify-content: center; }
        .logout-btn:hover { background: var(--bg-input); border-color: var(--text-muted); }

        .delete-btn { display: flex; align-items: center; gap: 8px; background: transparent; border: 1.5px solid rgba(220,38,38,0.3); border-radius: 12px; padding: 12px 24px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: #DC2626; cursor: pointer; transition: background 0.15s; width: 100%; justify-content: center; margin-top: 10px; }
        .delete-btn:hover { background: rgba(220,38,38,0.06); border-color: #DC2626; }

        .danger-note { font-size: 12px; color: var(--text-faint); margin-top: 10px; text-align: center; line-height: 1.5; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
        .modal { width: min(100%, 420px); background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 30px 80px rgba(0,0,0,0.3); padding: 32px; }
        .modal-title { font-family: 'DM Serif Display', serif; font-size: 24px; color: var(--text-primary); margin-bottom: 12px; }
        .modal-title em { font-style: italic; color: #DC2626; }
        .modal-body { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; }
        .modal-body strong { color: var(--text-primary); }
        .modal-actions { display: flex; gap: 10px; }
        .modal-delete-btn { flex: 1; background: #DC2626; color: #fff; border: none; border-radius: 12px; padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; }
        .modal-delete-btn:hover { background: #B91C1C; }
        .modal-cancel-btn { flex: 1; background: transparent; border: 1.5px solid var(--border); border-radius: 12px; padding: 13px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--text-muted); cursor: pointer; }
        .modal-cancel-btn:hover { background: var(--bg-input); }

        .page-footer { margin-top: 32px; text-align: center; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-faint); }
        .page-footer span { color: var(--gold); }
      `}</style>

      <div className="page">
        <div className="card">

          {/* BANNER */}
          <div className="banner">
            <a href="/" className="back-link">← Back to tasks</a>
            <p className="banner-label">Account</p>
            <h1 className="banner-title">Your <em>Settings</em></h1>
            <div className="avatar-row">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar-img" referrerPolicy="no-referrer" />
              ) : (
                <div className="avatar-placeholder">{user.name.charAt(0).toUpperCase()}</div>
              )}
              <div className="avatar-info">
                <span className="avatar-name">{user.name}</span>
                <span className="avatar-email">{user.email}</span>
                {user.googleId && (
                  <span className="avatar-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google Account
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="body">

            {/* PROFILE SECTION */}
            <div className="section">
              <p className="section-title">Profile</p>
              {actionData?.success && <div className="alert-success">{actionData.success}</div>}
              {actionData?.error && <div className="alert-error">{actionData.error}</div>}
              <Form method="post">
                <input type="hidden" name="intent" value="update-profile" />
                <div className="fields">
                  <div>
                    <label className="field-label" htmlFor="name">Display Name</label>
                    <input id="name" name="name" type="text" defaultValue={user.name} className="field-input" placeholder="Your name" />
                  </div>
                </div>
                <button type="submit" className="save-btn" style={{ marginTop: "20px" }}>Save Changes</button>
              </Form>
            </div>



            {/* ACCOUNT SECTION */}
            <div className="section">
              <p className="section-title">Account</p>
              <Form method="post" action="/logout">
                <button type="submit" className="logout-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </Form>
              <Form method="post" id="delete-form">
                <input type="hidden" name="intent" value="delete-account" />
                <button type="button" className="delete-btn" onClick={() => { const m = document.getElementById("delete-modal"); if (m) m.style.display = "flex"; }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Delete Account
                </button>
                <p className="danger-note">This will permanently delete your account and all your tasks.</p>
              </Form>
            </div>

          </div>
        </div>

        <footer className="page-footer">
          Built with <span>Remix</span> · <span>Prisma</span> · <span>PostgreSQL</span>
        </footer>
      </div>

      {/* DELETE MODAL */}
      <div id="delete-modal" className="modal-overlay" style={{ display: "none" }} onClick={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).style.display = "none"; }}>
        <div className="modal">
          <h2 className="modal-title">Delete <em>Account?</em></h2>
          <p className="modal-body">This will permanently delete <strong>{user.name}</strong>'s account and all associated tasks. <strong>This cannot be undone.</strong></p>
          <div className="modal-actions">
            <Form method="post" style={{ flex: 1 }}>
              <input type="hidden" name="intent" value="delete-account" />
              <button type="submit" className="modal-delete-btn">Yes, delete everything</button>
            </Form>
            <button type="button" className="modal-cancel-btn" onClick={() => { const m = document.getElementById("delete-modal"); if (m) m.style.display = "none"; }}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}