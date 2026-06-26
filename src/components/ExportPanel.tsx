// Export panel: tabs for the full .el theme file and the overrides snippet, each
// with copy + download.

import { useMemo } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs.tsx";
import { useThemeStore } from "~/state/theme-store.tsx";
import { exportOverrides, exportThemeFile } from "~/theme/export-el.ts";
import { getPreset } from "~/theme/presets.ts";

export function ExportPanel() {
  const { doc, baseId } = useThemeStore();

  const themeFile = useMemo(() => exportThemeFile(doc), [doc]);
  const overrides = useMemo(() => {
    const base = getPreset(baseId)?.doc;
    return base ? exportOverrides(doc, base, baseId) : "";
  }, [doc, baseId]);

  return (
    <Tabs defaultValue="file" className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <TabsList>
          <TabsTrigger value="file">Theme file</TabsTrigger>
          <TabsTrigger value="overrides">Overrides</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="file" className="min-h-0 flex-1">
        <CodeBlock
          code={themeFile}
          filename={`${doc.meta.name}-theme.el`}
          mime="text/x-emacs-lisp"
        />
      </TabsContent>
      <TabsContent value="overrides" className="min-h-0 flex-1">
        <CodeBlock code={overrides} filename={`${baseId}-overrides.el`} mime="text/x-emacs-lisp" />
      </TabsContent>
    </Tabs>
  );
}

function CodeBlock({ code, filename, mime }: { code: string; filename: string; mime: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  function download() {
    const blob = new Blob([code], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    // The anchor must be in the document for the `download` attribute to be
    // honored in all browsers; otherwise the file lands with a UUID name.
    document.body.appendChild(a);
    a.click();
    // Defer cleanup: revoking the object URL synchronously (before the browser
    // has started the download) cancels it or drops the filename.
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
    toast.success(`Downloaded ${filename}`);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 py-2">
        <Button size="sm" variant="outline" onClick={copy}>
          Copy
        </Button>
        <Button size="sm" variant="outline" onClick={download}>
          Download {filename}
        </Button>
      </div>
      <pre className="bg-muted/40 min-h-0 flex-1 overflow-auto px-3 pb-3 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
