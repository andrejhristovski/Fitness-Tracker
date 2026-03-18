"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { href: "/app", label: "Food", exact: true },
  { href: "/app/workouts", label: "Workouts", exact: false },
  { href: "/app/stats", label: "Stats", exact: false },
  { href: "/app/settings", label: "Settings", exact: false },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-1">
      {tabs.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--card)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
            }`}
          >
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleSignOut}
        className="ml-2 rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
      >
        Sign out
      </button>
    </nav>
  );
}
