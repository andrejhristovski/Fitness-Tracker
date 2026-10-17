import "server-only";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/session";

export type Fail = { ok: false; error: string };

/**
 * Runs a server action body for the signed-in user. Returns "Not signed in" without one,
 * and turns thrown database errors into a readable { ok: false } result for the UI.
 *
 * Every action that goes through here changes data, so on success it clears the cached
 * app pages: tabs stay cached between visits, but never show data from before a change.
 */
export async function withUser<R extends { ok: boolean }>(fn: (userId: string) => Promise<R>): Promise<R | Fail> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Not signed in" };
  try {
    const result = await fn(userId);
    if (result.ok) revalidatePath("/app", "layout");
    return result;
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong" };
  }
}
