// Top toolbar, kept to the three things a visitor needs: which theme, download
// it, export it. Everything else (name, author, sample language, share link,
// reset, app appearance, adding the theme to the gallery) lives in one menu.

import { Link, useNavigate } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AddThemeDialog } from "~/components/AddThemeDialog.tsx";
import { ExportDialog } from "~/components/ExportDialog.tsx";
import { PresetCombobox } from "~/components/PresetCombobox.tsx";
import { ThemeToggle } from "~/components/ThemeToggle.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover.tsx";
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
  const { spec, baseId, language, setMeta, setLanguage, reset, restore, shareUrl } =
    useThemeStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  function resetWithUndo() {
    const previous = spec;
    reset();
    setMenuOpen(false);
    toast("Theme reset to its starting point", {
      action: { label: "Undo", onClick: () => restore(previous) },
    });
  }

  function downloadTheme() {
    const filename = `${spec.meta.name}-theme.el`;
    downloadText(exportThemeFile(spec), filename, ELISP_MIME);
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
    setMenuOpen(false);
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

      <span className="text-muted-foreground hidden truncate font-mono text-xs sm:inline">
        {spec.meta.name}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setExportOpen(true)}>
          Export
        </Button>
        <Button size="sm" onClick={downloadTheme}>
          Download theme
        </Button>

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button size="icon-sm" variant="ghost" aria-label="Theme menu" title="Theme menu">
              <MenuIcon aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 gap-3">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium">Theme name</span>
              <Input
                value={spec.meta.name}
                onChange={(e) => setMeta({ name: e.target.value })}
                name="theme-name"
                spellCheck={false}
                autoComplete="off"
                className="h-8 font-mono text-xs"
              />
              <span className="text-muted-foreground">
                Becomes the file name and the symbol you load-theme.
              </span>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium">Description</span>
              <Input
                value={spec.meta.description}
                onChange={(e) => setMeta({ description: e.target.value })}
                name="theme-description"
                autoComplete="off"
                className="h-8 text-xs"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium">Author</span>
              <Input
                value={spec.meta.author ?? ""}
                onChange={(e) => setMeta({ author: e.target.value || undefined })}
                name="theme-author"
                placeholder="Your name, for the file header"
                autoComplete="name"
                className="h-8 text-xs"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium">Sample language</span>
              <Select value={language} onValueChange={(v) => setLanguage(v as LanguageId)}>
                <SelectTrigger size="sm" className="w-full text-xs">
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
            </label>
            <div className="flex flex-col gap-1.5 border-t pt-3">
              <Button size="sm" variant="outline" onClick={copyShareLink}>
                Copy share link
              </Button>
              <Button size="sm" variant="outline" onClick={resetWithUndo}>
                Reset to {baseId}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMenuOpen(false);
                  setAddOpen(true);
                }}
              >
                Add your theme to the gallery…
              </Button>
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-xs">
              <span className="text-muted-foreground">App appearance</span>
              <ThemeToggle />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        onAddTheme={() => {
          setExportOpen(false);
          setAddOpen(true);
        }}
      />
      <AddThemeDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
