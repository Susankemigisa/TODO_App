import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
} from "react-router";
import { useEffect, useState } from "react";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="img-src 'self' data: https://*.googleusercontent.com https://*.google.com https://*.googleapis.com;"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(8);

  const isWakingUp = isRouteErrorResponse(error) && error.status === 503;

  // Auto-retry once the countdown hits zero (Render cold starts
  // usually finish within ~30-60s, so a couple of cycles is enough).
  useEffect(() => {
    if (!isWakingUp) return;
    if (seconds <= 0) {
      navigate(0); // reload the current route
      return;
    }
    const t = setTimeout(() => setSeconds((s: number) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isWakingUp, seconds, navigate]);

  if (isWakingUp) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E0E0E",
          color: "#F0EDE7",
          fontFamily: '"DM Sans", "Inter", sans-serif',
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            textAlign: "center",
            background: "#1A1A1A",
            borderRadius: 16,
            padding: "2.5rem 2rem",
            border: "1px solid rgba(201, 169, 110, 0.25)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>☕</div>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: "1.5rem",
              margin: "0 0 0.5rem",
              color: "#C9A96E",
            }}
          >
            Waking up the server…
          </h1>
          <p style={{ color: "#999", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            The backend went to sleep after a period of inactivity. It usually
            takes under a minute to come back. Retrying automatically in{" "}
            <strong style={{ color: "#F0EDE7" }}>{seconds}s</strong>.
          </p>
          <button
            onClick={() => navigate(0)}
            style={{
              background: "#C9A96E",
              color: "#111111",
              border: "none",
              borderRadius: 8,
              padding: "0.65rem 1.5rem",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Retry now
          </button>
        </div>
      </main>
    );
  }

  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}