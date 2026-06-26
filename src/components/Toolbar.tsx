// Top toolbar: preset loader, theme name, sample language, share link, and
// reset. The background mode (light/dark) is not a user control — it's a
// property of the chosen preset, carried through on load and emitted to the
// exported theme file.

import { toast } from "sonner";

import { Button } from "~/components/ui/button.tsx";
import { Input } from "~/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select.tsx";
import { useThemeStore, type LanguageId } from "~/state/theme-store.tsx";
import { LANGUAGES } from "~/theme/highlight/languages.ts";
import { PRESET_GROUPS } from "~/theme/presets.ts";

export function Toolbar() {
  const { doc, baseId, language, setMeta, loadPreset, setLanguage, reset, shareUrl } =
    useThemeStore();

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
      <h1 className="text-sm font-bold">Modus Theme Generator</h1>

      <Select value={baseId} onValueChange={loadPreset}>
        <SelectTrigger size="sm" className="w-52 text-xs">
          <SelectValue placeholder="Base preset" />
        </SelectTrigger>
        <SelectContent>
          {PRESET_GROUPS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.presets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={doc.meta.name}
        onChange={(e) => setMeta({ name: e.target.value })}
        aria-label="Theme name"
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
        <Button size="sm" onClick={copyShareLink}>
          Copy share link
        </Button>
        <Button size="sm" variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
