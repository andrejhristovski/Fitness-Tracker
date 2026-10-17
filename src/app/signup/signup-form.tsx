"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthField, AuthMessage, AuthSubmit, PasswordField } from "@/components/auth-shell";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const trimmed = email.trim();
    // Signs the new user in straight away.
    const { error: err } = await authClient.signUp.email({ email: trimmed, password, name: trimmed.split("@")[0] });
    setLoading(false);
    if (err) {
      setError(err.message || "Couldn't create the account. Try again.");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <AuthMessage kind="error">{error}</AuthMessage>}
      <AuthField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <PasswordField
        label="Password"
        autoComplete="new-password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 6 characters"
      />
      <AuthSubmit loading={loading} loadingText="Creating account…">
        Create account
      </AuthSubmit>
    </form>
  );
}
