import { createAuthClient } from "better-auth/react";

/** Browser-side auth calls (sign in / sign up / sign out) to /api/auth. */
export const authClient = createAuthClient();
