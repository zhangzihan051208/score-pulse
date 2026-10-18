const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "THESPORTSDB_API_KEY",
];

const missing = required.filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error("Missing env:", missing.join(", "));
  console.error(
    "Add them in Cursor Environment → Secrets, then start a new Cloud Agent.",
  );
  process.exit(1);
}

const tsdbKey = process.env.THESPORTSDB_API_KEY;
const url = `https://www.thesportsdb.com/api/v1/json/${tsdbKey}/searchteams.php?t=Arsenal`;
const tsdb = await fetch(url);
console.log("TheSportsDB:", tsdb.ok ? "OK" : tsdb.status);

const base = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const health = await fetch(`${base}/rest/v1/`, {
  headers: { apikey: anon, Authorization: `Bearer ${anon}` },
});
console.log("Supabase REST:", health.status);

console.log("All configured secrets present.");
