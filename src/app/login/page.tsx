import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell subtitle="Welcome back" footer={{ text: "No account yet?", href: "/signup", link: "Create one" }}>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[var(--card)]" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
