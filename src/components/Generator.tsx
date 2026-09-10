// The main generator page: toolbar on top, editor on the left, live preview on
// the right. The editor opens on the Essentials panel (the colors an author
// chooses plus this session's changes); an Advanced toggle reveals the full
// palette and mapping editors. Clicking an element in the preview "inspects"
// the color or role behind it: in Essentials that opens one row for it, in
// Advanced it switches to the matching tab and reveals the field.

import { useState } from "react";

import { Toolbar } from "~/components/Toolbar.tsx";
import { EssentialsPanel, isEssentialKey } from "~/components/editor/EssentialsPanel.tsx";
import { MappingEditor } from "~/components/editor/MappingEditor.tsx";
import { PaletteEditor } from "~/components/editor/PaletteEditor.tsx";
import { SourcePanel } from "~/components/editor/SourcePanel.tsx";
import { CodeBufferPreview } from "~/components/preview/CodeBufferPreview.tsx";
import type { InspectTarget } from "~/components/preview/inspect.ts";
import { Button } from "~/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs.tsx";
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

type EditorTab = "essentials" | "palette" | "mappings";

function GeneratorInner() {
  const [advanced, setAdvanced] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("essentials");
  const [inspectedRole, setInspectedRole] = useState<RoleKey | null>(null);
  const [inspectedColor, setInspectedColor] = useState<ColorKey | null>(null);
  const [inspectedKey, setInspectedKey] = useState<string | null>(null);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  function inspect(target: InspectTarget) {
    if (editorTab === "essentials") {
      if (!isEssentialKey(target.key)) {
        setOpenKeys((prev) => (prev.includes(target.key) ? prev : [...prev, target.key]));
      }
      // Re-set even if unchanged so the same key can be re-inspected to re-scroll.
      setInspectedKey(null);
      requestAnimationFrame(() => setInspectedKey(target.key));
      return;
    }
    if (target.kind === "role") {
      setEditorTab("mappings");
      setInspectedRole(null);
      requestAnimationFrame(() => setInspectedRole(target.key));
    } else {
      setEditorTab("palette");
      setInspectedColor(null);
      requestAnimationFrame(() => setInspectedColor(target.key));
    }
  }

  function toggleAdvanced() {
    const next = !advanced;
    setAdvanced(next);
    setEditorTab(next ? "mappings" : "essentials");
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col md:h-screen">
      <Toolbar />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(380px,460px)_1fr]">
        <Tabs
          value={editorTab}
          onValueChange={(v) => setEditorTab(v as EditorTab)}
          className="order-2 flex min-h-0 flex-col border-t md:order-1 md:border-t-0 md:border-r"
        >
          <div className="flex items-center gap-2 px-2 pt-2">
            <TabsList>
              <TabsTrigger value="essentials">Essentials</TabsTrigger>
              {advanced ? (
                <>
                  <TabsTrigger value="palette">Palette</TabsTrigger>
                  <TabsTrigger value="mappings">Mappings</TabsTrigger>
                </>
              ) : null}
            </TabsList>
            <Button
              size="xs"
              variant="ghost"
              aria-pressed={advanced}
              onClick={toggleAdvanced}
              className="ml-auto"
              title={
                advanced
                  ? "Hide the full palette and mapping editors"
                  : "Show every named color and semantic mapping"
              }
            >
              Advanced
            </Button>
          </div>
          <TabsContent value="essentials" className="min-h-0 flex-1 overflow-auto">
            <EssentialsPanel
              inspectedKey={inspectedKey}
              openKeys={openKeys}
              onCloseKey={(key) => setOpenKeys((prev) => prev.filter((k) => k !== key))}
            />
          </TabsContent>
          {advanced ? (
            <>
              <TabsContent value="palette" className="min-h-0 flex-1 overflow-auto">
                <PaletteEditor inspectedColor={inspectedColor} />
              </TabsContent>
              <TabsContent value="mappings" className="min-h-0 flex-1 overflow-auto">
                <MappingEditor inspectedRole={inspectedRole} />
              </TabsContent>
            </>
          ) : null}
          <SourcePanel />
        </Tabs>

        <div className="order-1 min-h-0 md:order-2 h-[80vh] md:h-auto">
          <div className="h-full min-h-0 overflow-hidden p-3">
            <CodeBufferPreview onInspect={inspect} />
          </div>
        </div>
      </div>
    </div>
  );
}
