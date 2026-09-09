// The main generator page: toolbar on top, editor (palette + mappings) on the
// left, live preview + export on the right. Clicking an element in the preview
// "inspects" the color or role controlling it, switching to the matching editor
// tab (Palette for layer-1 colors, Mappings for layer-2 roles) and revealing the
// field.

import { useState } from "react";

import { ExportPanel } from "~/components/ExportPanel.tsx";
import { Toolbar } from "~/components/Toolbar.tsx";
import { MappingEditor } from "~/components/editor/MappingEditor.tsx";
import { PaletteEditor } from "~/components/editor/PaletteEditor.tsx";
import { CodeBufferPreview } from "~/components/preview/CodeBufferPreview.tsx";
import type { InspectTarget } from "~/components/preview/inspect.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs.tsx";
import { cn } from "~/lib/utils.ts";
import { ThemeStoreProvider } from "~/state/theme-store.tsx";
import type { ColorKey, RoleKey } from "~/theme/palette-keys.ts";

interface GeneratorProps {
  /** Base preset id from the /theme/$themeId route. */
  initialPresetId: string;
  /** Optional `?t=` shared-edit diff param. */
  initialParam?: string;
}

export function Generator({ initialPresetId, initialParam }: GeneratorProps) {
  return (
    // Remount on theme change so the store re-seeds from the new preset id.
    <ThemeStoreProvider
      key={initialPresetId}
      initialPresetId={initialPresetId}
      initialParam={initialParam}
    >
      <GeneratorInner />
    </ThemeStoreProvider>
  );
}

function GeneratorInner() {
  const [inspectedRole, setInspectedRole] = useState<RoleKey | null>(null);
  const [inspectedColor, setInspectedColor] = useState<ColorKey | null>(null);
  const [editorTab, setEditorTab] = useState("mappings");
  const [exportOpen, setExportOpen] = useState(false);

  function inspect(target: InspectTarget) {
    if (target.kind === "role") {
      setEditorTab("mappings");
      // Re-set even if unchanged so the same key can be re-inspected to re-scroll.
      setInspectedRole(null);
      requestAnimationFrame(() => setInspectedRole(target.key));
    } else {
      setEditorTab("palette");
      setInspectedColor(null);
      requestAnimationFrame(() => setInspectedColor(target.key));
    }
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col md:h-screen">
      <Toolbar />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(380px,460px)_1fr]">
        {/* Editor */}
        <Tabs
          value={editorTab}
          onValueChange={setEditorTab}
          className="order-2 flex min-h-0 flex-col border-t md:order-1 md:border-t-0 md:border-r"
        >
          <TabsList className="m-2">
            <TabsTrigger value="palette">Palette</TabsTrigger>
            <TabsTrigger value="mappings">Mappings</TabsTrigger>
          </TabsList>
          <TabsContent value="palette" className="min-h-0 flex-1 overflow-auto">
            <PaletteEditor inspectedColor={inspectedColor} />
          </TabsContent>
          <TabsContent value="mappings" className="min-h-0 flex-1 overflow-auto">
            <MappingEditor inspectedRole={inspectedRole} />
          </TabsContent>
        </Tabs>

        {/* Preview + export */}
        <div
          className={cn(
            "order-1 grid h-[80vh] min-h-0 md:order-2 md:h-auto",
            exportOpen ? "grid-rows-[1fr_minmax(0,45%)]" : "grid-rows-[1fr_auto]",
          )}
        >
          <div className="min-h-0 overflow-hidden p-3">
            <CodeBufferPreview onInspect={inspect} />
          </div>
          <div className="min-h-0 border-t">
            <ExportPanel open={exportOpen} onOpenChange={setExportOpen} />
          </div>
        </div>
      </div>
    </div>
  );
}
