// Export drawer under the preview: a header bar that is always visible (tabs +
// submit + collapse toggle) and, when open, the generated code with copy and
// download. The toolbar owns the primary "Download" action; this panel is for
// reading the output and for the overrides snippet.

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { SubmitThemeDialog } from "~/components/SubmitThemeDialog.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs.tsx";
import { downloadText, ELISP_MIME } from "~/lib/download.ts";
import { useThemeStore } from "~/state/theme-store.tsx";
import { exportOverrides, exportThemeFile } from "~/theme/export-el.ts";
import { getPreset } from "~/theme/presets.ts";

interface ExportPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportPanel({ open, onOpenChange }: ExportPanelProps) {
  const { doc, baseId } = useThemeStore();

  const themeFile = useMemo(() => exportThemeFile(doc), [doc]);
  const overrides = useMemo(() => {
    const base = getPreset(baseId)?.doc;
    return base ? exportOverrides(doc, base, baseId) : "";
  }, [doc, baseId]);

  const toggleLabel = open ? "Hide generated code" : "Show generated code";

  return (
    <Tabs defaultValue="file" className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <TabsList>
          <TabsTrigger value="file" onClick={() => onOpenChange(true)}>
            Theme file
          </TabsTrigger>
          <TabsTrigger value="overrides" onClick={() => onOpenChange(true)}>
            Overrides
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <SubmitThemeDialog doc={doc} />
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={toggleLabel}
            title={toggleLabel}
            aria-expanded={open}
            onClick={() => onOpenChange(!open)}
          >
            {open ? <ChevronDownIcon aria-hidden="true" /> : <ChevronUpIcon aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {open && (
        <>
          <TabsContent value="file" className="min-h-0 flex-1">
            <CodeBlock code={themeFile} filename={`${doc.meta.name}-theme.el`} />
          </TabsContent>
          <TabsContent value="overrides" className="min-h-0 flex-1">
            <CodeBlock code={overrides} filename={`${baseId}-overrides.el`} />
          </TabsContent>
        </>
      )}
    </Tabs>
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
    <div className="flex h-full flex-col">
      <div className="flex min-w-0 items-center gap-2 px-3 py-2">
        <Button size="sm" variant="outline" onClick={copy} aria-label={`Copy ${filename}`}>
          Copy
        </Button>
        <Button size="sm" variant="outline" onClick={download} className="min-w-0">
          <span className="truncate">Download {filename}</span>
        </Button>
      </div>
      <pre className="bg-muted/40 min-h-0 flex-1 overflow-auto px-3 pb-3 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
