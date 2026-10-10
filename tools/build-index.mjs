import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const postsDir = join(root, "content", "posts");
const outFile = join(root, "content", "posts.json");

function parseFrontmatter(raw) {
  const text = String(raw).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, body: text };

  const data = {};
  const lines = match[1].split("\n");
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1].toLowerCase();
    let value = kv[2].trim();

    if (value === "") {
      // List YAML multi-line (format output CMS): kumpulkan baris "- item".
      const items = [];
      let j = i + 1;
      while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
        items.push(lines[j].replace(/^\s*-\s+/, "").trim().replace(/^["']|["']$/g, ""));
        j++;
      }
      if (items.length) {
        data[key] = items;
        i = j - 1;
        continue;
      }
    }

    if (/^".*"$|^'.*'$/.test(value)) value = value.slice(1, -1);
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
    data[key] = value;
  }
  return { data, body: text.slice(match[0].length) };
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function readingTime(body) {
  const words = (String(body).replace(/```[\s\S]*?```/g, " ").match(/\S+/g) || []).length;
  return Math.max(1, Math.round(words / 200));
}

function excerpt(body, limit = 180) {
  const plain = String(body)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > limit ? plain.slice(0, limit).replace(/\s+\S*$/, "") + "…" : plain;
}

const files = (await readdir(postsDir, { withFileTypes: true }))
  .filter((e) => e.isFile() && /\.md$/i.test(e.name) && e.name[0] !== "_")
  .map((e) => e.name);

const posts = [];
for (const file of files) {
  const raw = await readFile(join(postsDir, file), "utf8");
  const { data, body } = parseFrontmatter(raw);
  const slug = file.replace(/\.md$/i, "");
  posts.push({
    slug,
    title: data.title || slug.replace(/-/g, " "),
    date: data.date ? String(data.date).slice(0, 10) : "",
    description: data.description || data.summary || excerpt(body),
    tags: toArray(data.tags),
    type: data.type === "note" ? "note" : "article",
    draft: data.draft === true || data.published === false,
    readingTime: readingTime(body),
  });
}

posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));

await writeFile(
  outFile,
  JSON.stringify({ generated: new Date().toISOString(), posts }, null, 2) + "\n",
  "utf8"
);

const drafts = posts.filter((p) => p.draft).length;
console.log(`content/posts.json → ${posts.length} post (${drafts} draft) dari ${files.length} file`);
