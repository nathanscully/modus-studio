// A faithful TypeScript port of Emacs `modus-themes-generate-palette` and the
// `color.el` primitives it depends on. Given a small set of BASE-COLORS (at
// minimum bg-main + fg-main, optionally the six hues and any other named
// colors), it derives the full ~120-color Modus palette plus the engine's
// default semantic mappings — exactly as Emacs does at theme-load time.
//
// This lets the app expand a handful of "brand" colors (Nord, Solarized, …)
// into a complete, valid Modus theme live in the browser, with no Emacs in the
// loop. The math is reproduced verbatim from upstream modus-themes.el / color.el
// (see docs/modus-ef-architecture.md §3) and validated against real Emacs output
// (the ef-summer 70→113 expansion) in generate-palette.test.ts.
//
// Upstream references (modus-themes.el `main`, fetched 2026-06-26):
//   modus-themes-generate-palette        ~L7577
//   modus-themes-adjust-value            ~L3695  (uses color.el HSL lighten)
//   modus-themes-generate-color-blend    ~L7524  (warmer→#ff0000, cooler→#0000ff)
//   modus-themes-color-dark-p            ~L4149  (WCAG contrast vs white/black)
//   modus-themes-color-is-warm-or-cool-p ~L7557  (r>b ⇒ warm)
// color.el: color-rgb-to-hsl, color-hsl-to-rgb, color-lighten-hsl, color-rgb-to-hex.

import { HUES, type ColorKey, type RoleKey } from "./palette-keys.ts";
import type { Mapping, MappingValue, Palette } from "./types.ts";

// --- color.el primitives (exact ports, including their quirks) -------------

/** Parse "#rgb"/"#rrggbb"/"#rrrrggggbbbb" to normalized [r,g,b] in 0..1. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  const per = h.length / 3; // 1, 2, or 4 hex digits per channel
  const max = 16 ** per - 1;
  const chan = (i: number) => parseInt(h.slice(i * per, i * per + per), 16) / max;
  return [chan(0), chan(1), chan(2)];
}

/** color-rgb-to-hsl: RGB (0..1) → HSL (0..1). Verbatim from color.el. */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return [0, 0, l];
  const s = l <= 0.5 ? delta / (max + min) : delta / (2 - max - min);
  const rc = (max - r) / delta;
  const gc = (max - g) / delta;
  const bc = (max - b) / delta;
  let h: number;
  if (r === max) h = bc - gc;
  else if (g === max) h = 2 + rc - bc;
  else h = 4 + gc - rc;
  h = mod(h / 6, 1);
  return [h, s, l];
}

/** color-hue-to-rgb: internal helper for color-hsl-to-rgb. */
function hueToRgb(v1: number, v2: number, h: number): number {
  if (h < 1 / 6) return v1 + (v2 - v1) * h * 6;
  if (h < 0.5) return v2;
  if (h < 2 / 3) return v1 + (v2 - v1) * (2 / 3 - h) * 6;
  return v1;
}

/** color-hsl-to-rgb: HSL (0..1) → RGB (0..1). Verbatim from color.el. */
function hslToRgb(H: number, S: number, L: number): [number, number, number] {
  if (S === 0) return [L, L, L];
  const m2 = L <= 0.5 ? L * (1 + S) : L + S - L * S;
  const m1 = 2 * L - m2;
  return [
    hueToRgb(m1, m2, mod(H + 1 / 3, 1)),
    hueToRgb(m1, m2, H),
    hueToRgb(m1, m2, mod(H - 1 / 3, 1)),
  ];
}

/**
 * color-lighten-hsl as shipped in released Emacs (verified against 30.2, which
 * is what the architecture-doc verification used and what stock users have):
 * a symmetric scale of luminance, L_new = clamp(L * (1 + percent/100)). So +5
 * brightens by 5%, −20 darkens by 20%. (The modus-themes `main` checkout carries
 * a different, asymmetric variant; we deliberately match the released behavior
 * so derived shades equal real load-time output — see generate-palette.test.ts.)
 */
function lightenHsl(H: number, S: number, L: number, percent: number): [number, number, number] {
  return [H, S, clamp(L * (1 + percent / 100))];
}

/**
 * color-rgb-to-hex with 4 digits/component: maxval 65535, "%04x" of a float.
 * Emacs's `format "%04x"` TRUNCATES the float toward zero (verified: 32921.70
 * → 0x8099, not 0x809a). Use Math.floor, not Math.round, or derived shades
 * drift by a digit. Inputs are clamped to [0,1] upstream so floor is safe.
 */
function rgbToHex4(r: number, g: number, b: number): string {
  const c = (x: number) =>
    Math.floor(x * 65535)
      .toString(16)
      .padStart(4, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** modus-themes--color-eight-to-six-digits: keep the first 2 of each 4-hex group. */
function eightToSix(hex: string): string {
  const h = hex.slice(1);
  if (h.length === 6 || h.length === 3) return hex;
  // 12-digit (#rrrrggggbbbb) → take first 2 of each 4.
  return `#${h.slice(0, 2)}${h.slice(4, 6)}${h.slice(8, 10)}`;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
function clamp(x: number): number {
  return Math.min(1, Math.max(0, x));
}

// --- modus-themes color helpers --------------------------------------------

/** modus-themes-adjust-value: luminance shift of COLOR by PERCENTAGE. */
function adjustValue(color: string, percentage: number): string {
  const [r, g, b] = hexToRgb(color);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [h2, s2, l2] = lightenHsl(h, s, l, percentage);
  const [r2, g2, b2] = hslToRgb(h2, s2, l2);
  return eightToSix(rgbToHex4(r2, g2, b2));
}

/** modus-themes-blend: linear blend of A toward B by ALPHA (A's influence). */
function blend(
  a: [number, number, number],
  b: [number, number, number],
  alpha: number,
): [number, number, number] {
  return [
    a[0] * alpha + b[0] * (1 - alpha),
    a[1] * alpha + b[1] * (1 - alpha),
    a[2] * alpha + b[2] * (1 - alpha),
  ];
}

function blendHex(color: string, blendedWith: string, alpha: number): string {
  const out = blend(hexToRgb(color), hexToRgb(blendedWith), alpha);
  return eightToSix(rgbToHex4(out[0], out[1], out[2]));
}

const warmer = (color: string, alpha: number) => blendHex(color, "#ff0000", alpha);
const cooler = (color: string, alpha: number) => blendHex(color, "#0000ff", alpha);

/** modus-themes-color-warm-p: more red than blue channel. */
function isWarm(color: string): boolean {
  const [r, , b] = hexToRgb(color);
  return r > b;
}

function warmerOrCooler(color: string, alpha: number, prefersCool: boolean): string {
  // preference wins; "warm" → warmer, anything else → cooler.
  const warm = prefersCool ? false : isWarm(color);
  return warm ? warmer(color, alpha) : cooler(color, alpha);
}

/** WCAG relative luminance (modus-themes-wcag-formula). */
function wcag(color: string): number {
  const [r, g, b] = hexToRgb(color);
  const contrib = (c: number, w: number) =>
    w * (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return contrib(r, 0.2126) + contrib(g, 0.7152) + contrib(b, 0.0722);
}

function contrast(c1: string, c2: string): number {
  const ratio = (wcag(c1) + 0.05) / (wcag(c2) + 0.05);
  return Math.max(ratio, 1 / ratio);
}

/** modus-themes-color-dark-p: more contrast against white than black. */
export function isDark(color: string): boolean {
  return contrast(color, "#ffffff") > contrast(color, "#000000");
}

// --- the generator ----------------------------------------------------------

export interface GenerateOptions {
  /** 'cool' | 'warm' override; if absent, inferred from bg-main. */
  preference?: "cool" | "warm";
  /**
   * Core palette to fill remaining COLOR entries (the colors half of the
   * CORE-PALETTE arg). In Emacs this is inferred (operandi/vivendi); here the
   * caller passes the appropriate base Modus palette so generated themes are
   * complete with no void colors.
   */
  corePalette: Palette;
  /**
   * Core MAPPINGS to fill remaining semantic roles (the mappings half of
   * CORE-PALETTE). Emacs's CORE-PALETTE is one alist holding both layers, so its
   * mappings (keyword→…, string→…, comment→…) backfill any role neither provided
   * nor derived. Omitting this leaves syntax roles unmapped — pass the core
   * theme's mappings so a generated theme highlights code like Modus does.
   */
  coreMappings?: Mapping;
  /** MAPPINGS override; entries here are NOT re-derived. */
  mappings?: Mapping;
}

export interface GeneratedPalette {
  palette: Palette;
  mappings: Mapping;
}

const SIX: readonly ColorKey[] = HUES as readonly ColorKey[];

/**
 * Port of `modus-themes-generate-palette`. BASE-COLORS is a partial palette
 * (must include bg-main + fg-main). Returns the full derived palette and the
 * default semantic mappings. Precedence (first wins): base, then derived, then
 * corePalette fill — matching upstream's seq-uniq dedup.
 */
export function generatePalette(baseColors: Palette, options: GenerateOptions): GeneratedPalette {
  const bgMain = baseColors["bg-main"];
  const fgMain = baseColors["fg-main"];
  if (!bgMain || !fgMain) {
    throw new Error("generatePalette requires at least bg-main and fg-main");
  }

  const bgDarkP = isDark(bgMain);
  const prefersCool = options.preference != null ? options.preference === "cool" : !isWarm(bgMain);

  const derivedColors: Palette = {};
  // The engine emits some mappings whose KEY is a layer-1 color name in our
  // model (e.g. bg-completion, bg-hl-line, bg-region, the mode-line entries):
  // upstream keeps them as mappings, but our typed vocabulary classifies them as
  // ColorKeys. Key the derived-mappings record by either layer so we can store
  // them; resolve.ts/css-vars read whichever bucket a name lands in.
  const derivedMappings: Record<string, MappingValue> = {};
  const baseMappings = (options.mappings ?? {}) as Record<string, MappingValue>;

  // Only set a derived color if the base didn't provide it.
  const pushColor = (name: ColorKey, value: string) => {
    if (baseColors[name] == null) derivedColors[name] = value;
  };
  const pushMapping = (name: ColorKey | RoleKey, value: MappingValue) => {
    if (baseMappings[name] == null) derivedMappings[name] = value;
  };

  // --- Base entries derived from bg-main / fg-main ---
  pushColor("bg-dim", adjustValue(bgMain, bgDarkP ? 5 : -5));
  pushColor("bg-active", adjustValue(bgMain, bgDarkP ? 10 : -10));
  pushColor("bg-inactive", adjustValue(bgMain, bgDarkP ? 8 : -8));
  pushColor("border", adjustValue(bgMain, bgDarkP ? 20 : -20));
  pushColor("fg-dim", adjustValue(fgMain, bgDarkP ? -20 : 20));
  pushColor("fg-alt", warmerOrCooler(adjustValue(fgMain, bgDarkP ? -10 : 10), 0.8, prefersCool));

  // --- Per-hue derivations ---
  for (const name of SIX) {
    const value = baseColors[name];
    if (value == null) continue; // a hue not in base produces no variants
    pushColor(`${name}-warmer` as ColorKey, adjustValue(warmer(value, 0.9), bgDarkP ? 20 : -20));
    pushColor(`${name}-cooler` as ColorKey, adjustValue(cooler(value, 0.9), bgDarkP ? 20 : -20));
    pushColor(`${name}-faint` as ColorKey, adjustValue(value, bgDarkP ? 10 : -10));
    pushColor(`${name}-intense` as ColorKey, adjustValue(value, bgDarkP ? -5 : 5));
    pushColor(`bg-${name}-intense` as ColorKey, adjustValue(value, bgDarkP ? -40 : 40));
    pushColor(`bg-${name}-subtle` as ColorKey, adjustValue(value, bgDarkP ? -60 : 60));
    pushColor(`bg-${name}-nuanced` as ColorKey, adjustValue(value, bgDarkP ? -80 : 80));
  }

  // --- Default mappings (cool/warm and light/dark variants) ---
  const cw = (cool: MappingValue, warm: MappingValue) => (prefersCool ? cool : warm);
  pushMapping("bg-completion", cw("bg-cyan-subtle", "bg-yellow-subtle"));
  pushMapping("bg-hover", cw("bg-green-intense", "bg-magenta-intense"));
  pushMapping("bg-hover-secondary", cw("bg-green-subtle", "bg-magenta-subtle"));
  pushMapping("bg-hl-line", cw("bg-cyan-nuanced", "bg-yellow-nuanced"));
  pushMapping("bg-paren-match", cw("bg-green-intense", "bg-yellow-subtle"));
  pushMapping("bg-paren-expression", cw("bg-green-nuanced", "bg-yellow-nuanced"));
  pushMapping("bg-region", "bg-active");
  pushMapping("fg-region", "fg-main");

  pushMapping("bg-mode-line-active", "bg-active");
  pushMapping("fg-mode-line-active", "fg-main");
  pushMapping("border-mode-line-active", "border");
  pushMapping("bg-mode-line-inactive", "bg-inactive");
  pushMapping("fg-mode-line-inactive", "fg-dim");
  pushMapping("border-mode-line-inactive", "border");

  pushMapping("modeline-err", "red-faint");
  pushMapping("modeline-warning", "yellow-faint");
  pushMapping("modeline-info", "blue-faint");

  pushMapping("bg-search-current", "bg-yellow-subtle");
  pushMapping("bg-search-lazy", "bg-magenta-subtle");
  pushMapping("bg-search-replace", "bg-red-subtle");
  pushMapping("bg-search-rx-group-0", "bg-blue-subtle");
  pushMapping("bg-search-rx-group-1", "bg-green-subtle");
  pushMapping("bg-search-rx-group-2", "bg-red-subtle");
  pushMapping("bg-search-rx-group-3", "bg-magenta-subtle");

  pushMapping("fg-search-current", "yellow-warmer");
  pushMapping("fg-search-lazy", "magenta-cooler");
  pushMapping("fg-search-replace", "red-cooler");
  pushMapping("fg-search-rx-group-0", "blue-warmer");
  pushMapping("fg-search-rx-group-1", "green-warmer");
  pushMapping("fg-search-rx-group-2", "red-cooler");
  pushMapping("fg-search-rx-group-3", "magenta-cooler");

  pushMapping("bg-prominent-err", "unspecified");
  pushMapping("bg-prominent-warning", "unspecified");
  pushMapping("bg-prominent-note", "unspecified");
  pushMapping("fg-prominent-err", "red-intense");
  pushMapping("fg-prominent-warning", "yellow-intense");
  pushMapping("fg-prominent-note", "green-intense");

  pushMapping("bg-active-argument", cw("bg-cyan-subtle", "bg-yellow-subtle"));
  pushMapping("fg-active-argument", cw("cyan-cooler", "yellow-warmer"));
  pushMapping("bg-active-value", cw("bg-magenta-subtle", "bg-blue-subtle"));
  pushMapping("fg-active-value", cw("magenta-cooler", "blue-warmer"));

  pushMapping("bg-tab-bar", "bg-dim");
  pushMapping("bg-tab-current", "bg-main");
  pushMapping("bg-tab-other", "bg-inactive");

  pushMapping("bg-added", "bg-green-subtle");
  pushMapping("bg-added-faint", "bg-green-nuanced");
  pushMapping("bg-added-refine", "bg-green-intense");
  pushMapping("fg-added", "green-faint");
  pushMapping("fg-added-intense", "green-intense");

  pushMapping("bg-changed", "bg-yellow-subtle");
  pushMapping("bg-changed-faint", "bg-yellow-nuanced");
  pushMapping("bg-changed-refine", "bg-yellow-intense");
  pushMapping("fg-changed", "yellow-faint");
  pushMapping("fg-changed-intense", "yellow-intense");

  pushMapping("bg-removed", "bg-red-subtle");
  pushMapping("bg-removed-faint", "bg-red-nuanced");
  pushMapping("bg-removed-refine", "bg-red-intense");
  pushMapping("fg-removed", "red-faint");
  pushMapping("fg-removed-intense", "red-intense");

  pushMapping("fg-heading-0", "fg-alt");
  pushMapping("fg-heading-1", "fg-main");
  pushMapping("fg-heading-2", cw("cyan", "yellow"));
  pushMapping("fg-heading-3", cw("green", "magenta"));
  pushMapping("fg-heading-4", cw("blue", "red"));
  pushMapping("fg-heading-5", cw("yellow", "cyan"));
  pushMapping("fg-heading-6", cw("magenta", "green"));
  pushMapping("fg-heading-7", cw("red", "blue"));
  pushMapping("fg-heading-8", "fg-dim");

  pushMapping("bg-term-black", bgDarkP ? "bg-main" : "fg-main");
  pushMapping("bg-term-black-bright", bgDarkP ? "bg-active" : "fg-dim");
  pushMapping("fg-term-black", bgDarkP ? "bg-main" : "fg-main");
  pushMapping("fg-term-black-bright", bgDarkP ? "bg-active" : "fg-dim");
  pushMapping("bg-term-white", bgDarkP ? "fg-dim" : "bg-active");
  pushMapping("bg-term-white-bright", bgDarkP ? "fg-main" : "bg-main");
  pushMapping("fg-term-white", bgDarkP ? "fg-dim" : "bg-active");
  pushMapping("fg-term-white-bright", bgDarkP ? "fg-main" : "bg-main");

  // --- Assemble with first-wins precedence (base → derived → core) ---
  // Spread order is reversed from precedence: later spreads win in JS, so the
  // highest-precedence source goes last. Colors: base > derived > core. Mappings:
  // base (override) > derived > core. This mirrors Emacs's seq-uniq keep-first
  // over (base ++ derived ++ core).
  const palette: Palette = { ...options.corePalette, ...derivedColors, ...baseColors };
  const mappings = {
    ...(options.coreMappings ?? {}),
    ...derivedMappings,
    ...baseMappings,
  } as Mapping;

  return { palette, mappings };
}
