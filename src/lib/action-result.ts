import "server-only";
import { getUserId } from "@/lib/session";

export type Fail = { ok: false; error: string };

/**
 * Runs a server action body for the signed-in user. Returns "Not signed in" without one,
 * and turns thrown database errors into a readable { ok: false } result for the UI.
 */
export async function withUser<R>(fn: (userId: string) => Promise<R>): Promise<R | Fail> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Not signed in" };
  try {
    return await fn(userId);
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
