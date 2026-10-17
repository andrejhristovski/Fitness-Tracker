import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <AuthShell subtitle="Create your account" footer={{ text: "Already have an account?", href: "/login", link: "Sign in" }}>
      <SignupForm />
    </AuthShell>
  );
}
