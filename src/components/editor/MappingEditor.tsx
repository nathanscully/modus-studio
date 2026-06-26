// Layer-2 editor: every semantic role, grouped into Accordion sections. When a
// role is inspected from the preview its section opens and its row scrolls into
// view and is highlighted.

import { useEffect, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion.tsx";
import { useThemeStore } from "~/state/theme-store.tsx";
import { ROLE_GROUPS, type RoleKey } from "~/theme/palette-keys.ts";
import { resolveValue } from "~/theme/resolve.ts";
import { RolePicker } from "./RolePicker.tsx";

const DEFAULT_OPEN = ROLE_GROUPS.slice(0, 2).map((g) => g.title);

interface MappingEditorProps {
  /** A role to highlight + reveal (set by the preview inspector). */
  inspectedRole?: RoleKey | null;
}

function groupTitleForRole(role: RoleKey): string | undefined {
  return ROLE_GROUPS.find((g) => (g.keys as readonly string[]).includes(role))?.title;
}

export function MappingEditor({ inspectedRole }: MappingEditorProps) {
  const { doc, setMapping } = useThemeStore();
  const [open, setOpen] = useState<string[]>(DEFAULT_OPEN);
  const rowRef = useRef<HTMLDivElement | null>(null);

  // When a role is inspected, open its section and scroll its row into view.
  useEffect(() => {
    if (!inspectedRole) return;
    const title = groupTitleForRole(inspectedRole);
    if (title) setOpen((prev) => (prev.includes(title) ? prev : [...prev, title]));
    const t = setTimeout(() => {
      rowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);
    return () => clearTimeout(t);
  }, [inspectedRole]);

  return (
    <Accordion type="multiple" value={open} onValueChange={setOpen}>
      {ROLE_GROUPS.map((group) => (
        <AccordionItem key={group.title} value={group.title}>
          <AccordionTrigger className="px-3 py-2 text-xs font-semibold">
            <span className="flex w-full items-center justify-between pr-2">
              {group.title}
              <span className="text-muted-foreground">{group.keys.length}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-2">
            {group.keys.map((role) => {
              const highlighted = role === inspectedRole;
              return (
                <div key={role} ref={highlighted ? rowRef : undefined}>
                  <RolePicker
                    role={role}
                    value={doc.mappings[role]}
                    resolved={resolveValue(doc, doc.mappings[role])}
                    highlighted={highlighted}
                    onChange={setMapping}
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
