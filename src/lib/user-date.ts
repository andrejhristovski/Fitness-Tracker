import { cookies } from "next/headers";

export const TZ_COOKIE = "tz";

/** Today's date ("YYYY-MM-DD") in the user's timezone, from the cookie set by <TimezoneSync />. */
export async function getUserToday(): Promise<string> {
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz || "UTC" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
