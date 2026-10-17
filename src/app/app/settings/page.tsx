import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import { SignOutButton } from "@/components/app-nav";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl space-y-8 pb-8">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <SettingsForm userId={user.id} initialSettings={settings} />

      {/* Hidden once the app runs installed (standalone). */}
      <section className="[@media(display-mode:standalone)]:hidden">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Install on your phone</h2>
        <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
          <p>
            <span className="font-semibold">iPhone (Safari):</span>{" "}
            <span className="text-[var(--muted)]">tap Share, then “Add to Home Screen”.</span>
          </p>
          <p>
            <span className="font-semibold">Android (Chrome):</span>{" "}
            <span className="text-[var(--muted)]">tap the ⋮ menu, then “Install app”.</span>
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Account</h2>
        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <p className="truncate px-4 py-3 text-sm">
            <span className="text-[var(--muted)]">Signed in as </span>
            {user.email}
          </p>
          <SignOutButton className="w-full rounded-none px-4 py-3 text-left text-base text-red-400 hover:bg-[var(--card-hover)] hover:text-red-300" />
        </div>
      </section>
    </div>
  );
}
