import { ImageResponse } from "next/og";

const SIZES = new Set([180, 192, 512]);

/**
 * App icon as PNG: green dumbbell on the app's dark background.
 * `?maskable=1` adds extra padding so Android's mask never clips the glyph.
 */
export async function GET(request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const maskable = new URL(request.url).searchParams.has("maskable");
  const glyph = Math.round(size * (maskable ? 0.5 : 0.62));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c0f",
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 64 64" fill="none" stroke="#22c55e" strokeWidth={5} strokeLinecap="round">
          <path d="M20 32h24M12 23v18M19 18v28M45 18v28M52 23v18" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
