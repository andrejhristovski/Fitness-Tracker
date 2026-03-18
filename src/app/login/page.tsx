import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Fitness Tracker</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to your account
          </p>
        </div>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-[var(--card)]" />}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-[var(--accent)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
