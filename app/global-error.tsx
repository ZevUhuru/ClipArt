"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fafafa",
            padding: "2rem",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "420px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto 1.5rem",
                borderRadius: 16,
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111", margin: 0 }}>
              Something went wrong
            </h1>
            <p style={{ color: "#6b7280", marginTop: "0.75rem", fontSize: "0.95rem", lineHeight: 1.6 }}>
              An unexpected error occurred. This has been logged and we&apos;re looking into it.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem 2rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg, #f97316, #ec4899)",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <p style={{ marginTop: "1rem" }}>
              <a
                href="/"
                style={{ color: "#9ca3af", fontSize: "0.85rem", textDecoration: "none" }}
              >
                Go back home
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
