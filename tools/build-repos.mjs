// Snapshot public repos from the GitHub API into content/repos.json.
// The site reads this same-origin file instead of hitting api.github.com
// from the browser (unauthenticated: 60 req/hour per IP, shared by every
// visitor behind the same NAT). CI refreshes it daily.
//
// If the API call fails (rate limit, outage), the previous snapshot is kept
// so the site never loses its project list over a transient error.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GITHUB_USER = "zeinzulaziz";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "content", "repos.json");

const headers = { Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(
  `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
  { headers }
);

if (!res.ok) {
  if (existsSync(outFile)) {
    console.warn(`GitHub API ${res.status} — snapshot lama dipertahankan`);
    process.exit(0);
  }
  throw new Error(`GitHub API ${res.status} dan belum ada snapshot`);
}

const repos = (await res.json())
  .filter((r) => !r.fork && r.name !== `${GITHUB_USER}.github.io`)
  .sort(
    (a, b) =>
      b.stargazers_count - a.stargazers_count ||
      String(b.pushed_at).localeCompare(String(a.pushed_at))
  )
  .map((r) => ({
    name: r.name,
    language: r.language,
    stargazers_count: r.stargazers_count || 0,
    description: r.description,
    homepage: r.homepage,
  }));

await writeFile(
  outFile,
  JSON.stringify({ generated: new Date().toISOString(), repos }, null, 2) + "\n",
  "utf8"
);
console.log(`content/repos.json → ${repos.length} repositori`);
