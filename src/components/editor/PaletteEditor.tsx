// Layer-1 editor: every named palette color, grouped into Accordion sections.
// When a color is inspected from the preview its section opens and its row
// scrolls into view and is highlighted.

import { useEffect, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion.tsx";
import { useThemeStore } from "~/state/theme-store.tsx";
import { COLOR_GROUPS, type ColorKey } from "~/theme/palette-keys.ts";
import { ColorField } from "./ColorField.tsx";

// Open the first two sections by default.
const DEFAULT_OPEN = COLOR_GROUPS.slice(0, 2).map((g) => g.title);

interface PaletteEditorProps {
  /** A color to highlight + reveal (set by the preview inspector). */
  inspectedColor?: ColorKey | null;
}

function groupTitleForColor(color: ColorKey): string | undefined {
  return COLOR_GROUPS.find((g) => (g.keys as readonly string[]).includes(color))?.title;
}

export function PaletteEditor({ inspectedColor }: PaletteEditorProps) {
  const { doc, setColor } = useThemeStore();
  const [open, setOpen] = useState<string[]>(DEFAULT_OPEN);
  const rowRef = useRef<HTMLDivElement | null>(null);

  // When a color is inspected, open its section and scroll its row into view.
  useEffect(() => {
    if (!inspectedColor) return;
    const title = groupTitleForColor(inspectedColor);
    if (title) setOpen((prev) => (prev.includes(title) ? prev : [...prev, title]));
    const t = setTimeout(() => {
      rowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);
    return () => clearTimeout(t);
  }, [inspectedColor]);

  return (
    <Accordion type="multiple" value={open} onValueChange={setOpen}>
      {COLOR_GROUPS.map((group) => (
        <AccordionItem key={group.title} value={group.title}>
          <AccordionTrigger className="px-3 py-2 text-xs font-semibold">
            <span className="flex w-full items-center justify-between pr-2">
              {group.title}
              <span className="text-muted-foreground">{group.keys.length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2">
            {group.keys.map((key) => {
              const highlighted = key === inspectedColor;
              return (
                <div key={key} ref={highlighted ? rowRef : undefined}>
                  <ColorField
                    colorKey={key}
                    value={doc.palette[key]}
                    highlighted={highlighted}
                    onChange={setColor}
                  />
                </div>
              );
            })}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
