"use client";

/** Last-resort screen if even the root layout fails (replaces the whole page, so it has its own <html>). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          background: "#0f1115",
          color: "#f5f7fa",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>Something went wrong</h1>
        <p style={{ margin: 0, color: "#8b909a" }}>The app didn&apos;t load. Your data is safe.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={() => location.reload()}
            style={{ border: 0, borderRadius: 12, padding: "12px 20px", background: "#b7f34a", color: "#0f1115", fontWeight: 600, fontSize: 16 }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={reset}
            style={{ border: "1px solid #2a2f38", borderRadius: 12, padding: "12px 20px", background: "transparent", color: "#f5f7fa", fontWeight: 600, fontSize: 16 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
