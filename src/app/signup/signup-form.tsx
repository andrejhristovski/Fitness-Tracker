"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthField, AuthMessage, AuthSubmit, PasswordField } from "@/components/auth-shell";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { data, error: err } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    // No email confirmation required: the user is signed in already.
    if (data.session) {
      router.push("/app");
      router.refresh();
      return;
    }
    setMessage("Almost done — check your email to confirm your account, then sign in.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <AuthMessage kind="error">{error}</AuthMessage>}
      {message && <AuthMessage kind="success">{message}</AuthMessage>}
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
