// One dialog for reading the generated code: the theme file (the primary
// export; the toolbar's Download writes the same text) and the overrides
// snippet for users who would rather keep the upstream theme and set
// `<base>-palette-overrides` in their init file.

import { useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs.tsx";
import { downloadText, ELISP_MIME } from "~/lib/download.ts";
import { useThemeStore } from "~/state/theme-store.tsx";
import { exportOverrides, exportThemeFile } from "~/theme/export-el.ts";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTheme: () => void;
}

export function ExportDialog({ open, onOpenChange, onAddTheme }: ExportDialogProps) {
  const { spec, preset, baseId } = useThemeStore();

  const themeFile = useMemo(() => (open ? exportThemeFile(spec) : ""), [open, spec]);
  const overrides = useMemo(
    () => (open ? exportOverrides(spec, preset.spec, baseId) : ""),
    [open, spec, preset, baseId],
  );

  const requirement =
    spec.kind === "partial"
      ? "Needs modus-themes 5: bundled with Emacs 31, or from GNU ELPA on Emacs 30."
      : "Loads with the modus-themes bundled in Emacs 30 and 31.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>{requirement}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="file" className="min-w-0">
          <TabsList>
            <TabsTrigger value="file">Theme file</TabsTrigger>
            <TabsTrigger value="overrides">Overrides snippet</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="min-w-0">
            <CodeBlock code={themeFile} filename={`${spec.meta.name}-theme.el`} />
          </TabsContent>
          <TabsContent value="overrides" className="min-w-0">
            <CodeBlock code={overrides} filename={`${baseId}-overrides.el`} />
          </TabsContent>
        </Tabs>
        <DialogFooter className="sm:justify-between">
          <p className="text-muted-foreground self-center text-xs">
            Happy with it? Publish the file in your own repo and add it to the gallery.
          </p>
          <Button size="sm" variant="outline" onClick={onAddTheme}>
            Add your theme…
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CodeBlock({ code, filename }: { code: string; filename: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${filename} to clipboard`);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  function download() {
    downloadText(code, filename, ELISP_MIME);
    toast.success(`Downloaded ${filename}`);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <Button size="sm" variant="outline" onClick={copy} aria-label={`Copy ${filename}`}>
          Copy
        </Button>
        <Button size="sm" variant="outline" onClick={download} className="min-w-0">
          <span className="truncate">Download {filename}</span>
        </Button>
      </div>
      <pre className="bg-muted/40 h-[50vh] overflow-auto rounded-md p-3 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
