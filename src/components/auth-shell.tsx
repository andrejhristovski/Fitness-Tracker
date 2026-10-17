"use client";

import Link from "next/link";
import { useState } from "react";

/** Centered card with the app icon, used by the login and sign-up pages. */
export function AuthShell({
  subtitle,
  children,
  footer,
}: {
  subtitle: string;
  children: React.ReactNode;
  footer: { text: string; href: string; link: string };
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <svg viewBox="0 0 64 64" className="h-10 w-10" fill="none" stroke="var(--accent)" strokeWidth={5} strokeLinecap="round" aria-hidden="true">
              <path d="M20 32h24M12 23v18M19 18v28M45 18v28M52 23v18" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Fitness Tracker</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
        {children}
        <p className="mt-8 text-center text-sm text-[var(--muted)]">
          {footer.text}{" "}
          <Link href={footer.href} className="font-semibold text-[var(--accent)] hover:underline">
            {footer.link}
          </Link>
        </p>
      </div>
    </div>
  );
}

export const authInputClass =
  "block w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-base text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

// Inputs sit inside their <label>, so no ids are needed (generated ids can differ
// between server and client render on the Suspense-wrapped login form).
export function AuthField({
  label,
  ...input
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{label}</span>
      <input className={authInputClass} {...input} />
    </label>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordField({
  label,
  ...input
}: { label: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{label}</span>
        <input type={visible ? "text" : "password"} className={`${authInputClass} pr-16`} {...input} />
      </label>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0 bottom-0 h-[50px] px-4 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function AuthMessage({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm ${
        kind === "error"
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
      }`}
    >
      {children}
    </div>
  );
}

export function AuthSubmit({ loading, children, loadingText }: { loading: boolean; children: React.ReactNode; loadingText: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-base font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
    >
      {loading ? loadingText : children}
    </button>
  );
}
