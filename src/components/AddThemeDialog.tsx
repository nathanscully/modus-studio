// "Add your theme": the contribution flow for a theme made here. The theme
// itself lives in the contributor's own repo, the way every theme in the
// gallery does; this repo only takes a small pointer file. The dialog walks
// through publishing the .el, then drafts that pointer (kind "source") and opens
// GitHub's new-file page for themes/community/<id>.json with the JSON filled in.

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog.tsx";
import { Input } from "~/components/ui/input.tsx";
import { downloadText, ELISP_MIME } from "~/lib/download.ts";
import { communityPrUrl } from "~/lib/site.ts";
import { useThemeStore } from "~/state/theme-store.tsx";
import { exportThemeFile } from "~/theme/export-el.ts";
import { getPreset } from "~/theme/presets.ts";
import { validateThemeFile, type SourceThemeFile } from "~/theme/theme-file.ts";

const SLUG_RE = /^[a-z0-9-]+$/;
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA_RE = /^[0-9a-f]{40}$/;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Accept "owner/name", a github.com URL, or a git remote and return "owner/name". */
export function parseRepo(input: string): string | null {
  const trimmed = input.trim();
  const url = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/.exec(trimmed);
  const ssh = /^git@github\.com:([^/\s]+)\/([^/\s]+)/.exec(trimmed);
  const m = url ?? ssh;
  const repo = m ? `${m[1]}/${m[2]!.replace(/\.git$/, "")}` : trimmed;
  return REPO_RE.test(repo) ? repo : null;
}

function idError(id: string): string | null {
  if (id === "") return "Required.";
  if (!SLUG_RE.test(id)) return "Lowercase letters, digits, and hyphens only.";
  if (getPreset(id)) return `"${id}" is already a theme in the gallery; pick another id.`;
  return null;
}

export function buildPointer(input: {
  id: string;
  repo: string;
  rev: string;
  file: string;
  theme: string;
  license: string;
}): SourceThemeFile {
  const pointer: SourceThemeFile = {
    kind: "source",
    id: input.id,
    source: { repo: input.repo, rev: input.rev, files: [input.file], theme: input.theme },
    install: `(use-package ${input.theme} :vc (:url "https://github.com/${input.repo}") :config (load-theme '${input.theme} t))`,
  };
  if (input.license.trim()) pointer.meta = { license: input.license.trim() };
  return pointer;
}

interface AddThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddThemeDialog({ open, onOpenChange }: AddThemeDialogProps) {
  const { spec } = useThemeStore();
  const themeName = spec.meta.name;
  const [id, setId] = useState(() => slugify(themeName));
  const [repoInput, setRepoInput] = useState("");
  const [file, setFile] = useState(`${themeName}-theme.el`);
  const [rev, setRev] = useState("");
  const [license, setLicense] = useState(spec.meta.license ?? "GPL-3.0-or-later");
  const [fetching, setFetching] = useState(false);

  const repo = parseRepo(repoInput);
  const idIssue = idError(id);
  const repoIssue =
    repoInput.trim() === "" ? null : repo ? null : "Use owner/name or a GitHub URL.";
  const revIssue = rev === "" || SHA_RE.test(rev) ? null : "A full 40-character commit SHA.";

  const { pointer, json, issues } = useMemo(() => {
    const pointer = buildPointer({
      id: id || "theme",
      repo: repo ?? "owner/name",
      rev: SHA_RE.test(rev) ? rev : "0".repeat(40),
      file: file.trim() || `${themeName}-theme.el`,
      theme: themeName,
      license,
    });
    const issues = validateThemeFile(pointer, pointer.id).filter(
      (i) => !i.message.startsWith("warning:"),
    );
    return { pointer, json: JSON.stringify(pointer, null, 2), issues };
  }, [id, repo, rev, file, themeName, license]);

  const ready =
    idIssue === null &&
    repo !== null &&
    SHA_RE.test(rev) &&
    file.trim() !== "" &&
    issues.length === 0;

  function downloadTheme() {
    const filename = `${themeName}-theme.el`;
    downloadText(exportThemeFile(spec), filename, ELISP_MIME);
    toast.success(`Downloaded ${filename}`);
  }

  async function fetchLatestCommit() {
    if (!repo) return;
    setFetching(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
      const commits = (await res.json()) as { sha?: string }[];
      const sha = commits[0]?.sha;
      if (!sha || !SHA_RE.test(sha)) throw new Error("no commit in the response");
      setRev(sha);
      toast.success(`Pinned ${repo} at ${sha.slice(0, 7)}`);
    } catch (error) {
      toast.error("Could not read the repo's latest commit", {
        description: `${error instanceof Error ? error.message : String(error)}. Paste the SHA instead.`,
      });
    } finally {
      setFetching(false);
    }
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json);
      toast.success("Copied the pointer JSON to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add your theme to the gallery</DialogTitle>
          <DialogDescription>
            Your theme stays in your repo, credited to you. The gallery adds one small pointer file
            and reads the palette from your commit.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex min-w-0 flex-col gap-4 text-sm">
          <Step n={1} title="Publish the theme file">
            <p className="text-muted-foreground text-xs">
              Download <code className="font-mono">{themeName}-theme.el</code> and push it to a
              public GitHub repo.
            </p>
            <Button size="sm" variant="outline" onClick={downloadTheme} className="self-start">
              Download {themeName}-theme.el
            </Button>
          </Step>

          <Step n={2} title="Point at it">
            <Field label="GitHub repo" error={repoIssue}>
              <Input
                name="repo"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="you/your-theme or https://github.com/you/your-theme"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={repoIssue !== null}
              />
            </Field>
            <Field label="File path in the repo">
              <Input
                name="file"
                value={file}
                onChange={(e) => setFile(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="font-mono text-xs"
              />
            </Field>
            <Field label="Commit to pin" error={revIssue}>
              <div className="flex gap-2">
                <Input
                  name="rev"
                  value={rev}
                  onChange={(e) => setRev(e.target.value.trim())}
                  placeholder="40-character commit SHA"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-xs"
                  aria-invalid={revIssue !== null}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchLatestCommit}
                  disabled={!repo || fetching}
                  className="shrink-0"
                >
                  {fetching ? "Fetching…" : "Use latest"}
                </Button>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Gallery id" error={idIssue}>
                <Input
                  name="theme-id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-xs"
                  aria-invalid={idIssue !== null}
                />
              </Field>
              <Field label="License">
                <Input
                  name="license"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="SPDX id, e.g. GPL-3.0-or-later"
                  autoComplete="off"
                  spellCheck={false}
                  className="text-xs"
                />
              </Field>
            </div>
          </Step>

          <Step n={3} title="Open the pull request">
            <p className="text-muted-foreground text-xs">
              The button opens GitHub with{" "}
              <code className="font-mono">themes/community/{pointer.id}.json</code> filled in.
              Propose the file and open the PR; CI resolves your theme and a preview deploy shows it
              in the gallery.
            </p>
            <pre className="bg-muted/40 max-h-40 overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap">
              <code>{json}</code>
            </pre>
          </Step>
        </ol>

        <DialogFooter className="sm:justify-between">
          <Button size="sm" variant="outline" onClick={copyJson} disabled={!ready}>
            Copy JSON
          </Button>
          <Button asChild size="sm" disabled={!ready}>
            <a
              href={ready ? communityPrUrl(pointer.id, json) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!ready}
              onClick={(e) => {
                if (!ready) e.preventDefault();
              }}
            >
              Open PR on GitHub
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="text-sm font-medium leading-6">{title}</h3>
        {children}
      </div>
    </li>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}
