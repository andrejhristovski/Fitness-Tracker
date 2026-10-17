import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/db";

/** Better Auth: email + password accounts stored in our own Postgres. */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days: stay signed in on your phone
    updateAge: 60 * 60 * 24, // refresh the expiry once a day of use
    // Keep a signed copy of the session in a cookie so most requests skip the
    // session lookup in the database. Sign-out still takes effect immediately on
    // this device; a revoked session elsewhere stops working within 5 minutes.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // Lets server actions set the session cookie.
  plugins: [nextCookies()],
});
