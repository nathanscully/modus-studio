// "Submit your theme" flow: collects contributor metadata, builds the kind:"full"
// theme file JSON for the working doc, validates it with the same rules CI runs,
// and hands the contributor a copy/download + a GitHub "new file" deep-link.
//
// A full theme JSON is far too large for a `?value=` prefill (~10KB, well past
// safe URL length), so submission stays manual: copy or download the JSON, then
// follow the filename-only prefilled GitHub link and paste it in.

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog.tsx";
import { Input } from "~/components/ui/input.tsx";
import { communityPrUrl } from "~/lib/site.ts";
import { getPreset } from "~/theme/presets.ts";
import type { FullThemeFile } from "~/theme/theme-file.ts";
import { validateThemeFile } from "~/theme/theme-file.ts";
import type { ThemeDoc } from "~/theme/types.ts";

const SLUG_RE = /^[a-z0-9-]+$/;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildThemeFile(
  doc: ThemeDoc,
  id: string,
  author: string,
  homepage: string,
): FullThemeFile {
  return {
    kind: "full",
    id,
    meta: {
      name: doc.meta.name,
      label: doc.meta.name,
      description: doc.meta.description,
      mode: doc.meta.mode,
      author: author.trim() || undefined,
      homepage: homepage.trim() || undefined,
      license: "GPL-3.0-or-later",
      tags: doc.meta.tags,
    },
    palette: doc.palette,
    mappings: doc.mappings,
  };
}

function idError(id: string): string | null {
  if (id === "") return "Required.";
  if (!SLUG_RE.test(id)) return "Lowercase letters, digits, and hyphens only.";
  if (getPreset(id))
    return `"${id}" is already a bundled theme id — try "${id}-2" or "${id}-mine".`;
  return null;
}

export function SubmitThemeDialog({ doc }: { doc: ThemeDoc }) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(() => slugify(doc.meta.name));
  const [author, setAuthor] = useState("");
  const [homepage, setHomepage] = useState("");
  const idInputRef = useRef<HTMLInputElement>(null);

  const idIssue = idError(id);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && idError(id) !== null) {
      requestAnimationFrame(() => idInputRef.current?.focus());
    }
  }

  const { file, json, issues } = useMemo(() => {
    const file = buildThemeFile(doc, id || "theme", author, homepage);
    const issues = validateThemeFile(file, file.id).filter(
      (i) => !i.message.startsWith("warning:"),
    );
    return { file, json: JSON.stringify(file, null, 2), issues };
  }, [doc, id, author, homepage]);

  const canSubmit = idIssue === null && issues.length === 0;

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      toast.success("Copied theme JSON to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  function download() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.id}.json`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
    toast.success(`Downloaded ${file.id}.json`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Submit your theme
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit your theme</DialogTitle>
          <DialogDescription>
            Community themes are submitted as GPL-3.0-or-later, matching the rest of this project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Theme id</span>
            <Input
              ref={idInputRef}
              name="theme-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="my-cool-theme"
              aria-invalid={idIssue !== null}
              aria-describedby={idIssue ? "theme-id-error" : undefined}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="text-xs text-muted-foreground">
              Lowercase, digits, hyphens. Becomes{" "}
              <code className="font-mono">themes/community/{id || "<id>"}.json</code>.
            </span>
            {idIssue && (
              <span id="theme-id-error" role="alert" className="text-xs text-destructive">
                {idIssue}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Author name</span>
            <Input
              name="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name or handle"
              autoComplete="name"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Homepage (optional)</span>
            <Input
              name="homepage"
              type="url"
              inputMode="url"
              value={homepage}
              onChange={(e) => setHomepage(e.target.value)}
              placeholder="https://…"
              autoComplete="url"
            />
          </label>

          {issues.length > 0 && (
            <div className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
              <p className="font-medium">This theme doesn’t validate yet:</p>
              <ul className="mt-1 list-disc pl-4">
                {issues.map((i) => (
                  <li key={i.message}>{i.message}</li>
                ))}
              </ul>
            </div>
          )}

          {canSubmit && (
            <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2.5 text-xs">
              <p className="font-medium">To submit:</p>
              <ol className="list-decimal pl-4">
                <li>Copy or download the theme JSON below.</li>
                <li>Open the GitHub link — it starts a new file at the right path.</li>
                <li>Paste the JSON in, propose the file, and open the PR.</li>
              </ol>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copy} disabled={!canSubmit}>
              Copy JSON
            </Button>
            <Button size="sm" variant="outline" onClick={download} disabled={!canSubmit}>
              Download {file.id}.json
            </Button>
          </div>
          <Button asChild size="sm" disabled={!canSubmit}>
            <a
              href={canSubmit ? communityPrUrl(file.id) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!canSubmit}
              onClick={(e) => {
                if (!canSubmit) e.preventDefault();
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
