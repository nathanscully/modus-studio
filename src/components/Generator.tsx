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
import { ThemeStoreProvider } from "~/state/theme-store.tsx";
import type { ColorKey, RoleKey } from "~/theme/palette-keys.ts";

export function Generator() {
  return (
    <ThemeStoreProvider>
      <GeneratorInner />
    </ThemeStoreProvider>
  );
}

function GeneratorInner() {
  const [inspectedRole, setInspectedRole] = useState<RoleKey | null>(null);
  const [inspectedColor, setInspectedColor] = useState<ColorKey | null>(null);
  const [editorTab, setEditorTab] = useState("mappings");

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
    <div className="bg-background text-foreground flex h-screen flex-col">
      <Toolbar />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(380px,460px)_1fr]">
        {/* Editor */}
        <Tabs
          value={editorTab}
          onValueChange={setEditorTab}
          className="flex min-h-0 flex-col border-r"
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
        <div className="grid min-h-0 grid-rows-[1fr_minmax(0,40%)]">
          <div className="min-h-0 overflow-hidden p-3">
            <CodeBufferPreview onInspect={inspect} />
          </div>
          <div className="min-h-0 border-t">
            <ExportPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
