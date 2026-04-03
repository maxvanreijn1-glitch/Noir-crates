import postgres from "postgres";

// Warn at startup rather than throw — the throw happens at query time if DATABASE_URL is missing.
// This allows `next build` to succeed without a live database connection.
if (!process.env.DATABASE_URL) {
  console.warn(
    "[noir-admin] WARNING: DATABASE_URL is not set. Database operations will fail.\n" +
    "Set DATABASE_URL in your .env.local (dev) or Vercel environment variables (prod)."
  );
}

const sql = postgres(process.env.DATABASE_URL ?? "postgresql://localhost/noir", {
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : "require",
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  // Prevent connection attempts at module load time; connect lazily on first query
  connection: { application_name: "noir-crates" },
});

export default sql;
