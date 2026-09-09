// Create or re-pin a pointer theme file from a GitHub repo.
//
//   node scripts/pin-theme.ts <owner/name> <theme-symbol> [--collection community]
//        [--id <id>] [--files a.el,b.el] [--rev <sha>] [--install "<elisp>"]
//
// Looks up the default branch head (or uses --rev), the repo license, and the
// files the theme needs: <theme>-theme.el plus every same-repo file it
// `require`s, transitively. Writes themes/<collection>/<id>.json. Run
// `node scripts/resolve-themes.ts --update-lock` afterwards.
//
// Set GITHUB_TOKEN to raise the API rate limit.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { SourceThemeFile } from "../src/theme/theme-file.ts";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const option = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const [repo, theme] = positional;
if (!repo || !theme || !/^[^/]+\/[^/]+$/.test(repo)) {
  console.error(
    "usage: node scripts/pin-theme.ts <owner/name> <theme-symbol> [--collection c] [--id id] [--files a.el,b.el] [--rev sha] [--install elisp]",
  );
  process.exit(1);
}
const collection = option("collection") ?? "community";
const id = option("id") ?? theme;

const headers: Record<string, string> = { accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

async function raw(rev: string, path: string): Promise<string> {
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/${rev}/${path}`);
  if (!res.ok) throw new Error(`raw ${path} -> ${res.status}`);
  return res.text();
}

const info = await api<{ default_branch: string; license: { spdx_id: string } | null }>(
  `/repos/${repo}`,
);
const rev =
  option("rev") ??
  (await api<{ sha: string }>(`/repos/${repo}/commits/${info.default_branch}`)).sha;
const tree = await api<{ tree: { path: string; type: string }[] }>(
  `/repos/${repo}/git/trees/${rev}?recursive=1`,
);
const elFiles = tree.tree
  .filter((t) => t.type === "blob" && t.path.endsWith(".el"))
  .map((t) => t.path);

let files: string[];
const explicit = option("files");
if (explicit) {
  files = explicit.split(",").map((f) => f.trim());
} else {
  const entry = elFiles.find((p) => p.endsWith(`/${theme}-theme.el`) || p === `${theme}-theme.el`);
  if (!entry) {
    console.error(
      `no ${theme}-theme.el in ${repo}@${rev.slice(0, 7)}; candidates: ${elFiles.join(", ")}`,
    );
    process.exit(1);
  }
  files = [];
  const queue = [entry];
  while (queue.length > 0) {
    const path = queue.shift()!;
    if (files.includes(path)) continue;
    const text = await raw(rev, path);
    for (const m of text.matchAll(/\(require '([A-Za-z0-9_.+-]+)/g)) {
      const dep = elFiles.find((p) => p === `${m[1]}.el` || p.endsWith(`/${m[1]}.el`));
      if (dep && !files.includes(dep)) queue.push(dep);
    }
    files.push(path);
  }
  files.reverse();
}

const pointer: SourceThemeFile = {
  kind: "source",
  id,
  source: { repo, rev, files, theme },
};
const install = option("install");
if (install) pointer.install = install;
const license = info.license?.spdx_id;
if (license && license !== "NOASSERTION") pointer.meta = { license };

const dir = join(ROOT, "themes", collection);
mkdirSync(dir, { recursive: true });
const out = join(dir, `${id}.json`);
if (existsSync(out)) {
  const previous = JSON.parse(readFileSync(out, "utf8")) as SourceThemeFile;
  pointer.meta = { ...previous.meta, ...pointer.meta };
  if (previous.install && !pointer.install) pointer.install = previous.install;
}
writeFileSync(out, `${JSON.stringify(pointer, null, 2)}\n`);
console.info(
  `${out.slice(ROOT.length + 1)}: ${repo}@${rev.slice(0, 7)} files=${files.join(",")}${license ? ` license=${license}` : ""}`,
);
