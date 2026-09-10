// The default editor view: the handful of colors a theme author actually
// chooses, then the rows this session has changed. Everything else in the
// palette is derived live by generatePalette, exactly as Emacs derives it, so
// a first-time user meets a dozen swatches instead of the engine's 330 rows.
//
// Essentials: bg-main, fg-main, bg-dim, fg-dim and the six hues. A row whose
// value the theme never set shows the derived color; editing it pins the value
// into the working spec's base colors.
//
// Changes: one row per color or mapping that differs from the base preset, plus
// any key the preview inspector opened. Each row reverts with one click.

import { RotateCcwIcon, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "~/components/ui/button.tsx";
import { specChanges, useThemeStore } from "~/state/theme-store.tsx";
import { HUES, isColorKey, type ColorKey, type RoleKey } from "~/theme/palette-keys.ts";
import { resolveValue } from "~/theme/resolve.ts";
import { ColorField } from "./ColorField.tsx";
import { RolePicker } from "./RolePicker.tsx";

export const ESSENTIAL_KEYS: readonly ColorKey[] = [
  "bg-main",
  "fg-main",
  "bg-dim",
  "fg-dim",
  ...HUES,
];

const ESSENTIAL_SET: ReadonlySet<string> = new Set(ESSENTIAL_KEYS);

export function isEssentialKey(key: string): boolean {
  return ESSENTIAL_SET.has(key);
}

interface EssentialsPanelProps {
  /** A key to highlight and scroll to (set by the preview inspector). */
  inspectedKey?: string | null;
  /** Keys the inspector opened that are not (yet) changes; shown as rows too. */
  openKeys: readonly string[];
  onCloseKey: (key: string) => void;
}

export function EssentialsPanel({ inspectedKey, openKeys, onCloseKey }: EssentialsPanelProps) {
  const { spec, doc, preset, setColor, setMapping, revert } = useThemeStore();
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!inspectedKey) return;
    const t = setTimeout(() => {
      rowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);
    return () => clearTimeout(t);
  }, [inspectedKey]);

  const changes = specChanges(spec, preset.spec);
  const changed = new Set(changes.map((c) => c.key));
  const rows: string[] = [
    ...changes.map((c) => c.key).filter((k) => !isEssentialKey(k)),
    ...openKeys.filter((k) => !changed.has(k) && !isEssentialKey(k)),
  ];
  const colors = spec.colors as Record<string, string | undefined>;

  return (
    <div className="flex flex-col gap-4 px-3 py-3">
      <section>
        <SectionTitle
          title="Essentials"
          hint="The colors a theme is built from. The rest of the palette follows."
        />
        <div className="mt-1 flex flex-col">
          {ESSENTIAL_KEYS.map((key) => {
            const highlighted = key === inspectedKey;
            const derived = colors[key] == null;
            return (
              <div
                key={key}
                ref={highlighted ? rowRef : undefined}
                className="flex items-center gap-2"
              >
                <div className="min-w-0 flex-1">
                  <ColorField
                    colorKey={key}
                    value={doc.palette[key]}
                    highlighted={highlighted}
                    onChange={setColor}
                  />
                </div>
                <RowTag changed={changed.has(key)} derived={derived} />
                {changed.has(key) ? (
                  <RevertButton label={`Revert ${key}`} onClick={() => revert(key)} />
                ) : (
                  <span className="size-7 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Changes"
          hint={
            rows.length === 0
              ? "Click anything in the preview to edit the color or mapping behind it."
              : `${rows.length} ${rows.length === 1 ? "entry" : "entries"} differ from ${preset.label}.`
          }
        />
        <div className="mt-1 flex flex-col">
          {rows.map((key) => {
            const highlighted = key === inspectedKey;
            const isChange = changed.has(key);
            return (
              <div
                key={key}
                ref={highlighted ? rowRef : undefined}
                className="flex items-center gap-2"
              >
                <div className="min-w-0 flex-1">
                  {isColorKey(key) ? (
                    <ColorField
                      colorKey={key}
                      value={doc.palette[key]}
                      highlighted={highlighted}
                      onChange={setColor}
                    />
                  ) : (
                    <RolePicker
                      role={key as RoleKey}
                      value={doc.mappings[key as RoleKey]}
                      resolved={resolveValue(doc, doc.mappings[key as RoleKey])}
                      highlighted={highlighted}
                      onChange={setMapping}
                    />
                  )}
                </div>
                {isChange ? (
                  <RevertButton label={`Revert ${key}`} onClick={() => revert(key)} />
                ) : (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Close ${key}`}
                    title="Close this row"
                    onClick={() => onCloseKey(key)}
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-1">
      <h2 className="text-xs font-semibold">{title}</h2>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  );
}

function RowTag({ changed, derived }: { changed: boolean; derived: boolean }) {
  const label = changed ? "edited" : derived ? "derived" : null;
  return (
    <span
      className="text-muted-foreground w-12 shrink-0 text-right text-[10px]"
      title={
        changed
          ? "Differs from the base theme"
          : derived
            ? "Not set by the theme; derived from the other colors"
            : undefined
      }
    >
      {label}
    </span>
  );
}

function RevertButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="icon-sm" variant="ghost" aria-label={label} title={label} onClick={onClick}>
      <RotateCcwIcon aria-hidden="true" />
    </Button>
  );
}
