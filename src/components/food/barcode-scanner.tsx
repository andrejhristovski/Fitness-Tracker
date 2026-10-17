"use client";

import { useEffect, useRef, useState } from "react";

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"] as const;

/** Native BarcodeDetector where available (Chrome/Android), otherwise the ZXing WebAssembly ponyfill (iOS Safari etc.). */
async function createDetector(): Promise<Detector> {
  const Native = (globalThis as { BarcodeDetector?: new (o: { formats: readonly string[] }) => Detector }).BarcodeDetector;
  if (Native) return new Native({ formats: FORMATS });
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: [...FORMATS] });
}

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

/** Full-screen camera view that reads product barcodes; also accepts a typed barcode. */
export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [errorText, setErrorText] = useState("");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-camera");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        const video = videoRef.current;
        if (!video || stopped) return;
        video.srcObject = stream;
        await video.play();
        const detector = await createDetector();
        setStatus("scanning");

        const tick = async () => {
          if (stopped) return;
          try {
            if (video.readyState >= 2) {
              const found = await detector.detect(video);
              const code = found.find((b) => b.rawValue)?.rawValue;
              if (code) {
                stopped = true;
                navigator.vibrate?.(60);
                onDetected(code);
                return;
              }
            }
          } catch {
            // A bad frame — keep scanning.
          }
          timer = setTimeout(tick, 200);
        };
        tick();
      } catch (e) {
        setStatus("error");
        setErrorText(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access for this site, or type the barcode below."
            : "Couldn't start the camera. You can type the barcode below."
        );
      }
    }

    start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="font-semibold text-white">Scan barcode</p>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white">
          Cancel
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
        {/* Aim guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-40 w-72 max-w-[80%] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            {status === "scanning" && <div className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-[var(--accent)]" />}
          </div>
        </div>
        <p className="absolute inset-x-0 bottom-6 px-6 text-center text-sm text-white/90">
          {status === "starting" && "Starting camera…"}
          {status === "scanning" && "Point the camera at the barcode"}
          {status === "error" && errorText}
        </p>
      </div>

      <form
        className="flex gap-2 bg-[var(--card)] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.replace(/\D/g, "").length >= 6) onDetected(typed.replace(/\D/g, ""));
        }}
      >
        <input
          inputMode="numeric"
          placeholder="Or type the barcode number"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 tabular-nums outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={typed.replace(/\D/g, "").length < 6}
          className="rounded-xl bg-[var(--accent)] px-4 font-semibold text-[var(--on-accent)] disabled:opacity-40"
        >
          Look up
        </button>
      </form>
    </div>
  );
}
