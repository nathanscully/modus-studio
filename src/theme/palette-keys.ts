// The Modus theme vocabulary: category-grouped, ordered lists of every layer-1
// named color key and every layer-2 semantic role key.
//
// These arrays are the single source of truth for:
//   - which keys exist (the `ColorKey` / `RoleKey` unions are derived from them),
//   - the order the editor renders sections/rows, and
//   - the stable, diff-friendly order the .el exporter emits.
//
// Transcribed from modus-themes.el (upstream). Hex values live in the per-theme
// seed files (modus-operandi.ts / modus-vivendi.ts); this file only names keys.

export interface KeyGroup<K extends string> {
  /** Section title shown in the editor and as a comment in exported elisp. */
  title: string;
  keys: readonly K[];
}

// ---------------------------------------------------------------------------
// Layer 1 — named colors
// ---------------------------------------------------------------------------

export const HUES = ["red", "green", "yellow", "blue", "magenta", "cyan"] as const;
const HUE_VARIANTS = ["", "-warmer", "-cooler", "-faint", "-intense"] as const;

// red, red-warmer, ... cyan-intense
const hueColors = HUES.flatMap((h) => HUE_VARIANTS.map((v) => `${h}${v}`));

// bg-red-intense ... bg-cyan-nuanced
const bgAccent = (suffix: string) => HUES.map((h) => `bg-${h}-${suffix}`);

// bg-graph-red-0 ... bg-graph-cyan-1
const graphColors = HUES.flatMap((h) => [`bg-graph-${h}-0`, `bg-graph-${h}-1`]);

// bg-term-black ... fg-term-white-bright
const TERM_HUES = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"] as const;
const termColors = TERM_HUES.flatMap((h) => [
  `bg-term-${h}`,
  `fg-term-${h}`,
  `bg-term-${h}-bright`,
  `fg-term-${h}-bright`,
]);

export const COLOR_GROUPS = [
  {
    title: "Basic values",
    keys: [
      "bg-main",
      "bg-dim",
      // bg-alt is used by the ef-themes (a third background tier between dim and
      // active); harmless as an extra named color for Modus themes.
      "bg-alt",
      "fg-main",
      "fg-dim",
      "fg-alt",
      "bg-active",
      "bg-inactive",
      "border",
    ],
  },
  { title: "Common hues", keys: hueColors },
  {
    title: "Uncommon accent foregrounds",
    keys: ["rust", "gold", "olive", "slate", "indigo", "maroon", "pink"],
  },
  { title: "Intense backgrounds", keys: bgAccent("intense") },
  { title: "Subtle backgrounds", keys: bgAccent("subtle") },
  { title: "Nuanced backgrounds", keys: bgAccent("nuanced") },
  {
    title: "Uncommon background/foreground pairs",
    keys: [
      "bg-clay",
      "fg-clay",
      "bg-ochre",
      "fg-ochre",
      "bg-lavender",
      "fg-lavender",
      "bg-sage",
      "fg-sage",
    ],
  },
  { title: "Graph colors", keys: graphColors },
  {
    title: "Special purpose backgrounds",
    keys: [
      "bg-completion",
      "bg-popup",
      "bg-hover",
      "bg-hover-secondary",
      "bg-hl-line",
      "bg-region",
      "bg-char-0",
      "bg-char-1",
      "bg-char-2",
      // ef-themes' prominent-state backgrounds (the ef common mappings point the
      // bg-prominent-*/bg-mark-* roles at these named colors).
      "bg-err",
      "bg-warning",
      "bg-info",
    ],
  },
  {
    title: "Mode line",
    keys: [
      "bg-mode-line-active",
      "border-mode-line-active",
      "bg-mode-line-inactive",
      "fg-mode-line-inactive",
      "border-mode-line-inactive",
      "modeline-err",
      "modeline-warning",
      "modeline-info",
    ],
  },
  { title: "Tab bar", keys: ["bg-tab-bar", "bg-tab-current", "bg-tab-other"] },
  {
    title: "Diffs",
    keys: [
      "bg-added",
      "bg-added-faint",
      "bg-added-refine",
      "bg-added-fringe",
      "fg-added",
      "fg-added-intense",
      "bg-changed",
      "bg-changed-faint",
      "bg-changed-refine",
      "bg-changed-fringe",
      "fg-changed",
      "fg-changed-intense",
      "bg-removed",
      "bg-removed-faint",
      "bg-removed-refine",
      "bg-removed-fringe",
      "fg-removed",
      "fg-removed-intense",
      "bg-diff-context",
    ],
  },
  { title: "Parentheses", keys: ["bg-paren-match", "bg-paren-expression"] },
  { title: "Terminal / ANSI", keys: termColors },
] as const satisfies readonly KeyGroup<string>[];

// ---------------------------------------------------------------------------
// Layer 2 — semantic role mappings
// ---------------------------------------------------------------------------

export const ROLE_GROUPS = [
  {
    title: "General UI",
    keys: ["cursor", "keybind", "name", "identifier", "err", "warning", "info"],
  },
  {
    title: "Underlines",
    keys: ["underline-err", "underline-warning", "underline-note"],
  },
  {
    title: "Prominent indicators",
    keys: [
      "bg-prominent-err",
      "fg-prominent-err",
      "bg-prominent-warning",
      "fg-prominent-warning",
      "bg-prominent-note",
      "fg-prominent-note",
    ],
  },
  {
    title: "Active arguments & values",
    keys: ["bg-active-argument", "fg-active-argument", "bg-active-value", "fg-active-value"],
  },
  {
    title: "Code syntax",
    keys: [
      "builtin",
      "comment",
      "constant",
      "docstring",
      "docmarkup",
      "fnname",
      "fnname-call",
      "keyword",
      "preprocessor",
      "property",
      "rx-backslash",
      "rx-construct",
      "string",
      "type",
      "variable",
      "variable-use",
      "bracket",
      "delimiter",
      "number",
      "operator",
      "punctuation",
    ],
  },
  { title: "Accents", keys: ["accent-0", "accent-1", "accent-2", "accent-3"] },
  {
    title: "Completion",
    keys: [
      "fg-completion-match-0",
      "fg-completion-match-1",
      "fg-completion-match-2",
      "fg-completion-match-3",
      "bg-completion-match-0",
      "bg-completion-match-1",
      "bg-completion-match-2",
      "bg-completion-match-3",
    ],
  },
  {
    title: "Dates",
    keys: [
      "date-now",
      "date-common",
      "date-deadline",
      "date-deadline-subtle",
      "date-event",
      "date-holiday",
      "date-holiday-other",
      "date-range",
      "date-scheduled",
      "date-scheduled-subtle",
      "date-weekday",
      "date-weekend",
    ],
  },
  {
    title: "Line numbers",
    keys: [
      "fg-line-number-inactive",
      "fg-line-number-active",
      "bg-line-number-inactive",
      "bg-line-number-active",
    ],
  },
  {
    title: "Links",
    keys: [
      "fg-link",
      "underline-link",
      "bg-link",
      "fg-link-symbolic",
      "underline-link-symbolic",
      "bg-link-symbolic",
      "fg-link-visited",
      "underline-link-visited",
      "bg-link-visited",
    ],
  },
  {
    title: "Parentheses & prompt",
    keys: ["fg-paren-match", "underline-paren-match", "fg-prompt", "bg-prompt"],
  },
  { title: "Mode line status", keys: ["fg-mode-line-active", "fg-region"] },
  {
    title: "Buttons",
    keys: ["fg-button-active", "bg-button-active", "fg-button-inactive", "bg-button-inactive"],
  },
  { title: "Fringe", keys: ["fringe"] },
  {
    title: "Whitespace",
    keys: ["bg-space", "fg-space", "bg-space-err"],
  },
  {
    title: "Prose / markup",
    keys: [
      "fg-prose-code",
      "fg-prose-macro",
      "fg-prose-verbatim",
      "bg-prose-code",
      "bg-prose-macro",
      "bg-prose-verbatim",
      "bg-prose-block-delimiter",
      "fg-prose-block-delimiter",
      "bg-prose-block-contents",
      "prose-done",
      "prose-todo",
      "prose-metadata",
      "prose-metadata-value",
      "prose-table",
      "prose-table-formula",
      "prose-tag",
    ],
  },
  {
    title: "Search",
    keys: [
      "fg-search-current",
      "fg-search-lazy",
      "fg-search-static",
      "fg-search-replace",
      "bg-search-current",
      "bg-search-lazy",
      "bg-search-static",
      "bg-search-replace",
      "fg-search-rx-group-0",
      "fg-search-rx-group-1",
      "fg-search-rx-group-2",
      "fg-search-rx-group-3",
      "bg-search-rx-group-0",
      "bg-search-rx-group-1",
      "bg-search-rx-group-2",
      "bg-search-rx-group-3",
    ],
  },
  {
    title: "Marks",
    keys: [
      "bg-mark-delete",
      "fg-mark-delete",
      "bg-mark-select",
      "fg-mark-select",
      "bg-mark-other",
      "fg-mark-other",
    ],
  },
  {
    title: "Mail",
    keys: [
      "mail-cite-0",
      "mail-cite-1",
      "mail-cite-2",
      "mail-cite-3",
      "mail-part",
      "mail-recipient",
      "mail-subject",
      "mail-other",
    ],
  },
  {
    title: "Headings",
    keys: [
      "fg-heading-0",
      "fg-heading-1",
      "fg-heading-2",
      "fg-heading-3",
      "fg-heading-4",
      "fg-heading-5",
      "fg-heading-6",
      "fg-heading-7",
      "fg-heading-8",
      "bg-heading-0",
      "bg-heading-1",
      "bg-heading-2",
      "bg-heading-3",
      "bg-heading-4",
      "bg-heading-5",
      "bg-heading-6",
      "bg-heading-7",
      "bg-heading-8",
      "overline-heading-0",
      "overline-heading-1",
      "overline-heading-2",
      "overline-heading-3",
      "overline-heading-4",
      "overline-heading-5",
      "overline-heading-6",
      "overline-heading-7",
      "overline-heading-8",
    ],
  },
  {
    title: "Rainbow delimiters",
    keys: [
      "rainbow-0",
      "rainbow-1",
      "rainbow-2",
      "rainbow-3",
      "rainbow-4",
      "rainbow-5",
      "rainbow-6",
      "rainbow-7",
      "rainbow-8",
    ],
  },
] as const satisfies readonly KeyGroup<string>[];

// ---------------------------------------------------------------------------
// Derived unions + flat ordered lists
// ---------------------------------------------------------------------------

export type ColorKey = (typeof COLOR_GROUPS)[number]["keys"][number];
export type RoleKey = (typeof ROLE_GROUPS)[number]["keys"][number];

export const COLOR_KEYS: readonly ColorKey[] = COLOR_GROUPS.flatMap((g) => g.keys);
export const ROLE_KEYS: readonly RoleKey[] = ROLE_GROUPS.flatMap((g) => g.keys);

const COLOR_KEY_SET = new Set<string>(COLOR_KEYS);

/** True when `value` names a layer-1 palette color (vs a raw hex / "unspecified"). */
export function isColorKey(value: string): value is ColorKey {
  return COLOR_KEY_SET.has(value);
}
