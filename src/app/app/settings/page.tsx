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
    <div className="mx-auto max-w-2xl space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Your profile and nutrition goals
        </p>
      </div>
      <SettingsForm userId={user.id} initialSettings={settings} />
      {/* Phones have no header, so sign out lives here. */}
      <div className="border-t border-[var(--border)] pt-6 sm:hidden">
        <p className="mb-2 truncate text-sm text-[var(--muted)]">Signed in as {user.email}</p>
        <SignOutButton className="w-full rounded-xl border border-[var(--border)] py-3 text-base text-red-400 hover:text-red-300" />
      </div>
    </div>
  );
}
