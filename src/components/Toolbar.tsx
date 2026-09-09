// Top toolbar: preset loader, theme name, sample language, share link, and
// reset. The background mode (light/dark) is not a user control — it's a
// property of the chosen preset, carried through on load and emitted to the
// exported theme file.

import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PresetCombobox } from "~/components/PresetCombobox.tsx";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select.tsx";
import { downloadText, ELISP_MIME } from "~/lib/download.ts";
import { useThemeStore, type LanguageId } from "~/state/theme-store.tsx";
import { exportThemeFile } from "~/theme/export-el.ts";
import { LANGUAGES } from "~/theme/highlight/languages.ts";

export function Toolbar() {
  const { doc, baseId, language, setMeta, setLanguage, reset, restore, shareUrl } = useThemeStore();
  const navigate = useNavigate();

  function resetWithUndo() {
    const previous = doc;
    reset();
    toast("Theme reset to its starting point", {
      action: { label: "Undo", onClick: () => restore(previous) },
    });
  }

  function downloadTheme() {
    const filename = `${doc.meta.name}-theme.el`;
    downloadText(exportThemeFile(doc), filename, ELISP_MIME);
    toast.success(`Downloaded ${filename}`, {
      description: "Put it on your custom-theme-load-path and load-theme it.",
    });
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <div className="bg-card flex flex-wrap items-center gap-3 border-b px-4 py-2">
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-sm font-semibold tracking-tight transition-colors"
        aria-label="Back to the gallery"
      >
        <span className="transition-transform group-hover:-translate-x-0.5">←</span>
        <span>
          modus<span className="opacity-50">-</span>studio
        </span>
      </Link>

      <PresetCombobox
        value={baseId}
        onSelect={(id) => navigate({ to: "/theme/$themeId", params: { themeId: id } })}
      />

      <Input
        value={doc.meta.name}
        onChange={(e) => setMeta({ name: e.target.value })}
        aria-label="Theme name"
        name="theme-name"
        spellCheck={false}
        autoComplete="off"
        className="h-8 w-44 font-mono text-xs"
      />

      <span
        className="text-muted-foreground rounded-md border px-2 py-1 text-xs"
        title="Background mode is set by the chosen preset and written to the exported theme"
      >
        {doc.meta.mode}
      </span>

      <Select value={language} onValueChange={(v) => setLanguage(v as LanguageId)}>
        <SelectTrigger size="sm" className="w-36 text-xs">
          <SelectValue placeholder="Sample" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(LANGUAGES).map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={resetWithUndo}>
          Reset
        </Button>
        <Button size="sm" variant="outline" onClick={copyShareLink}>
          Copy share link
        </Button>
        <Button size="sm" onClick={downloadTheme}>
          Download theme
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}
