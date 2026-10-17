"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

const tabs = [
  {
    href: "/app",
    label: "Home",
    exact: true,
    icon: (
      <svg {...ICON}>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />
      </svg>
    ),
  },
  {
    href: "/app/food",
    label: "Food",
    exact: false,
    icon: (
      <svg {...ICON}>
        <path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M9 3v6M17 21V3c-2 1.5-3 4-3 7v4h3" />
      </svg>
    ),
  },
  {
    href: "/app/workouts",
    label: "Workouts",
    exact: false,
    icon: (
      <svg {...ICON}>
        <path d="M8 12h8M4 9v6M7 7v10M17 7v10M20 9v6" />
      </svg>
    ),
  },
  {
    href: "/app/stats",
    label: "Stats",
    exact: false,
    icon: (
      <svg {...ICON}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    href: "/app/settings",
    label: "Profile",
    exact: false,
    icon: (
      <svg {...ICON}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string, exact: boolean) => (exact ? pathname === href : pathname.startsWith(href));
}

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={`rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)] ${className}`}
    >
      Sign out
    </button>
  );
}

/** Desktop / tablet: tabs in the header. */
export function AppNav() {
  const isActive = useIsActive();
  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {tabs.map(({ href, label, exact }) => (
        <Link
          key={href}
          href={href}
          prefetch
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive(href, exact)
              ? "bg-[var(--card)] text-[var(--accent)]"
              : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
          }`}
        >
          {label}
        </Link>
      ))}
      <SignOutButton className="ml-2" />
    </nav>
  );
}

/** Phone: fixed bottom tab bar, like a native app. */
export function BottomNav() {
  const isActive = useIsActive();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      aria-label="Main"
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ href, label, exact, icon }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              // Load each tab's data in the background so switching tabs is instant.
              prefetch
              aria-current={active ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                active ? "text-[var(--accent)]" : "text-[var(--muted)] active:text-[var(--foreground)]"
              }`}
            >
              <span className="h-6 w-6">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
