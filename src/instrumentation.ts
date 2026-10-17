/**
 * Runs once when the server starts: applies any pending database migrations
 * (from ./drizzle) so a fresh database is ready without a manual step.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const { db } = await import("@/db");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Database migrations are up to date");
}
