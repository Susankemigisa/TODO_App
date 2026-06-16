import { redirect } from "react-router";
import { getUserId } from "../session.server";
import type { Route } from "./+types/landing";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return {};
}

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap",
    },
  ];
}

export default function Landing() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0E0E0E;
          --bg-card: #1A1A1A;
          --bg-input: #242424;
          --text: #F0EDE7;
          --muted: #999;
          --faint: #555;
          --border: #2E2E2E;
          --gold: #C9A96E;
          --gold-dim: rgba(201,169,110,0.12);
          --gold-glow: rgba(201,169,110,0.2);
        }
        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .serif { font-family: 'DM Serif Display', serif; }

        nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 48px; border-bottom: 1px solid var(--border);
          position: sticky; top: 0; background: var(--bg); z-index: 10;
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; }
        .nav-logo span { font-family: 'DM Serif Display', serif; font-style: italic; color: var(--gold); font-size: 20px; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-links a { color: var(--muted); text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .nav-links a:hover { color: var(--text); }
        .nav-cta { background: var(--text); color: var(--bg); border: none; border-radius: 10px; padding: 10px 22px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; transition: opacity 0.2s; }
        .nav-cta:hover { opacity: 0.85; }

        .hero {
          max-width: 860px; margin: 0 auto;
          padding: 120px 48px 80px;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(201,169,110,0.3); border-radius: 99px;
          padding: 6px 16px; font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 32px;
        }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }
        .hero h1 {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(48px, 8vw, 80px);
          line-height: 1.0; color: var(--text); margin-bottom: 24px;
        }
        .hero h1 em { font-style: italic; color: var(--gold); }
        .hero p { font-size: 18px; color: var(--muted); line-height: 1.7; max-width: 560px; margin: 0 auto 48px; }
        .hero-actions { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .btn-primary {
          background: var(--gold); color: #111; border: none; border-radius: 12px;
          padding: 16px 36px; font-family: 'DM Sans', sans-serif; font-size: 16px;
          font-weight: 700; cursor: pointer; text-decoration: none;
          transition: opacity 0.2s, transform 0.15s;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-secondary {
          background: transparent; color: var(--text);
          border: 1px solid var(--border); border-radius: 12px;
          padding: 16px 36px; font-family: 'DM Sans', sans-serif; font-size: 16px;
          font-weight: 500; cursor: pointer; text-decoration: none;
          transition: border-color 0.2s, transform 0.15s;
        }
        .btn-secondary:hover { border-color: var(--gold); transform: translateY(-1px); }

        .preview {
          max-width: 760px; margin: 0 auto 120px;
          padding: 0 48px;
        }
        .preview-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 20px; overflow: hidden;
        }
        .preview-bar {
          background: #111; padding: 14px 20px;
          display: flex; align-items: center; gap: 12px;
        }
        .preview-dot { width: 10px; height: 10px; border-radius: 50%; }
        .preview-header {
          background: #000; padding: 28px 32px 24px;
          border-bottom: 1px solid var(--border);
        }
        .preview-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .preview-title { font-family: 'DM Serif Display', serif; font-size: 28px; }
        .preview-title em { font-style: italic; color: var(--gold); }
        .preview-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid var(--border); }
        .preview-stat { padding: 16px 24px; text-align: center; border-right: 1px solid var(--border); }
        .preview-stat:last-child { border-right: none; }
        .preview-stat-num { font-size: 28px; font-weight: 700; color: var(--text); }
        .preview-stat-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); margin-top: 2px; }
        .preview-body { padding: 24px 32px; display: flex; flex-direction: column; gap: 12px; }
        .preview-task {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; background: var(--bg); border-radius: 12px;
          border: 1px solid var(--border);
        }
        .preview-check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border); flex-shrink: 0; }
        .preview-check.done { border-color: var(--gold); background: var(--gold-dim); display: flex; align-items: center; justify-content: center; }
        .check-inner { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); }
        .preview-task-text { flex: 1; font-size: 14px; }
        .preview-task-text.done { text-decoration: line-through; color: var(--faint); }
        .preview-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 99px; }
        .badge-high { color: #FF4444; background: rgba(255,68,68,0.12); border: 1px solid rgba(255,68,68,0.2); }
        .badge-medium { color: var(--gold); background: var(--gold-dim); border: 1px solid rgba(201,169,110,0.2); }
        .badge-low { color: var(--muted); background: rgba(107,114,128,0.12); border: 1px solid rgba(107,114,128,0.2); }

        .features {
          max-width: 1000px; margin: 0 auto 120px; padding: 0 48px;
        }
        .section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--gold); margin-bottom: 12px; text-align: center;
        }
        .section-title {
          font-family: 'DM Serif Display', serif; font-size: clamp(32px, 5vw, 48px);
          text-align: center; margin-bottom: 64px; line-height: 1.1;
        }
        .section-title em { font-style: italic; color: var(--gold); }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .feature-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; padding: 28px;
          transition: border-color 0.2s;
        }
        .feature-card:hover { border-color: rgba(201,169,110,0.3); }
        .feature-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--gold-dim); border: 1px solid rgba(201,169,110,0.2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px; font-size: 20px;
        }
        .feature-card h3 { font-size: 17px; font-weight: 600; margin-bottom: 8px; }
        .feature-card p { font-size: 14px; color: var(--muted); line-height: 1.7; }

        .stack {
          max-width: 760px; margin: 0 auto 120px; padding: 0 48px; text-align: center;
        }
        .stack-chips { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px; margin-top: 40px; }
        .stack-chip {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 99px; padding: 10px 20px;
          font-size: 14px; font-weight: 500;
        }
        .stack-chip-dot { width: 8px; height: 8px; border-radius: 50%; }

        .cta-section {
          max-width: 660px; margin: 0 auto 120px; padding: 0 48px; text-align: center;
        }
        .cta-box {
          background: var(--bg-card); border: 1px solid rgba(201,169,110,0.2);
          border-radius: 24px; padding: 64px 48px;
        }
        .cta-box h2 { font-family: 'DM Serif Display', serif; font-size: 40px; margin-bottom: 16px; }
        .cta-box h2 em { font-style: italic; color: var(--gold); }
        .cta-box p { color: var(--muted); font-size: 16px; margin-bottom: 36px; }

        footer {
          border-top: 1px solid var(--border); padding: 32px 48px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; color: var(--faint);
        }
        footer a { color: var(--faint); text-decoration: none; }
        footer a:hover { color: var(--muted); }

        @media (max-width: 600px) {
          nav { padding: 20px 24px; }
          .hero { padding: 80px 24px 60px; }
          .preview { padding: 0 24px; }
          .features { padding: 0 24px; }
          .cta-section { padding: 0 24px; }
          footer { padding: 24px; flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      <nav>
        <div className="nav-logo">
          <svg width="32" height="32" viewBox="0 0 80 80" fill="none">
            <polygon points="40,4 72,40 40,76 8,40" fill="none" stroke="#C9A96E" strokeWidth="2.5"/>
            <polygon points="40,18 58,40 40,62 22,40" fill="#C9A96E" opacity="0.15"/>
          </svg>
          <span>Tasks</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#stack">Built with</a>
        </div>
        <a href="/login" className="nav-cta">Sign in</a>
      </nav>

      <section className="hero">
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          Now with NestJS API
        </div>
        <h1>Your tasks,<br /><em>beautifully</em> organised</h1>
        <p>A professional task manager with priorities, recurring tasks, subtasks, and smart date grouping — built for people who mean business.</p>
        <div className="hero-actions">
          <a href="/signup" className="btn-primary">Get started free</a>
          <a href="/login" className="btn-secondary">Sign in →</a>
        </div>
      </section>

      <div className="preview">
        <div className="preview-card">
          <div className="preview-bar">
            <div className="preview-dot" style={{background:"#FF5F57"}} />
            <div className="preview-dot" style={{background:"#FFBD2E"}} />
            <div className="preview-dot" style={{background:"#28C840"}} />
          </div>
          <div className="preview-header">
            <div className="preview-header-top">
              <div>
                <div style={{fontSize:"10px",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",color:"#555",marginBottom:"4px"}}>TODAY'S FOCUS</div>
                <div className="preview-title">My <em>Tasks</em></div>
              </div>
              <div style={{fontSize:"13px",color:"#555"}}>Suzan Kemigisa</div>
            </div>
            <div style={{height:"3px",background:"#2E2E2E",borderRadius:"99px",marginBottom:"8px"}}>
              <div style={{width:"75%",height:"100%",background:"#C9A96E",borderRadius:"99px"}} />
            </div>
            <div style={{fontSize:"12px",color:"#555",textAlign:"right"}}>75% done</div>
          </div>
          <div className="preview-stats">
            <div className="preview-stat">
              <div className="preview-stat-num">12</div>
              <div className="preview-stat-label">Total</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-num">3</div>
              <div className="preview-stat-label">Active</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-num">9</div>
              <div className="preview-stat-label">Done</div>
            </div>
          </div>
          <div className="preview-body">
            <div className="preview-task">
              <div className="preview-check done"><div className="check-inner" /></div>
              <div className="preview-task-text done">Deploy NestJS API to Render</div>
              <div className="preview-badge badge-high">High</div>
            </div>
            <div className="preview-task">
              <div className="preview-check" />
              <div className="preview-task-text">Write technical docs</div>
              <div className="preview-badge badge-medium">Medium</div>
            </div>
            <div className="preview-task">
              <div className="preview-check done"><div className="check-inner" /></div>
              <div className="preview-task-text done">Set up Google OAuth</div>
              <div className="preview-badge badge-low">Low</div>
            </div>
          </div>
        </div>
      </div>

      <section className="features" id="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything you need to<br /><em>stay on top</em></h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Priority levels</h3>
            <p>Mark tasks as Low, Medium, or High priority with colour-coded badges so the important things always stand out.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔁</div>
            <h3>Recurring tasks</h3>
            <p>Set tasks to repeat daily, weekly, or monthly. Define start and end dates for full control over recurring work.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Subtasks</h3>
            <p>Break big tasks into smaller steps. Track progress on each part of a complex piece of work.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Smart grouping</h3>
            <p>Tasks are automatically grouped into Today, Yesterday, This Week, and Older — no manual sorting needed.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Search & filter</h3>
            <p>Instantly find any task with live search, or filter by All, Active, and Completed in one click.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌙</div>
            <h3>Dark mode</h3>
            <p>Automatically adapts to your system preference. Easy on the eyes, day or night.</p>
          </div>
        </div>
      </section>

      <section className="stack" id="stack">
        <div className="section-label">Tech stack</div>
        <h2 className="section-title">Built <em>professionally</em></h2>
        <div className="stack-chips">
          <div className="stack-chip">
            <div className="stack-chip-dot" style={{background:"#00B4D8"}} />
            Remix / React Router v7
          </div>
          <div className="stack-chip">
            <div className="stack-chip-dot" style={{background:"#E0234E"}} />
            NestJS
          </div>
          <div className="stack-chip">
            <div className="stack-chip-dot" style={{background:"#5A67D8"}} />
            PostgreSQL
          </div>
          <div className="stack-chip">
            <div className="stack-chip-dot" style={{background:"#2D3748"}} />
            Prisma ORM
          </div>
          <div className="stack-chip">
            <div className="stack-chip-dot" style={{background:"#38A169"}} />
            JWT Auth
          </div>
          <div className="stack-chip">
            <div className="stack-chip-dot" style={{background:"#4285F4"}} />
            Google OAuth
          </div>
          <div className="stack-chip">
            <div className="stack-chip-dot" style={{background:"#46E3B7"}} />
            Neon Database
          </div>
          <div className="stack-chip">
            <div className="stack-chip-dot" style={{background:"#FF6B6B"}} />
            Render
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to get<br /><em>organised?</em></h2>
          <p>Join today and start managing your tasks like a professional.</p>
          <div style={{display:"flex",gap:"16px",justifyContent:"center",flexWrap:"wrap"}}>
            <a href="/signup" className="btn-primary">Create free account</a>
            <a href="/login" className="btn-secondary">I have an account</a>
          </div>
        </div>
      </section>

      <footer>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <svg width="20" height="20" viewBox="0 0 80 80" fill="none">
            <polygon points="40,4 72,40 40,76 8,40" fill="none" stroke="#C9A96E" strokeWidth="2.5"/>
            <polygon points="40,18 58,40 40,62 22,40" fill="#C9A96E" opacity="0.15"/>
          </svg>
          <span style={{fontFamily:"'DM Serif Display',serif",fontStyle:"italic",color:"#C9A96E",fontSize:"14px"}}>Tasks</span>
        </div>
        <div>Built with Remix · NestJS · PostgreSQL</div>
        <div style={{display:"flex",gap:"20px"}}>
          <a href="/login">Sign in</a>
          <a href="/signup">Sign up</a>
        </div>
      </footer>
    </>
  );
}