import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** The signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async () => {
  const result = await auth.api.getSession({ headers: await headers() });
  return result?.user ?? null;
});

/** For pages: the signed-in user, or a redirect to the login page. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For server actions: the signed-in user's id, or an error to return to the client. */
export async function getUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null;
}
