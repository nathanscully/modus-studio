// Bundled starting-point themes. Modus is the base family; the ef-themes are
// built on top of modus-themes (since ef 2.0) so they port faithfully and export
// as self-contained modus-themes derivatives. The classic-theme import library
// (Solarized, Gruvbox, …) is deferred to a later phase.
//
// The ef-* presets are generated faithfully from the upstream ef-themes repo
// (see each seed file header). Light and dark variants are grouped separately so
// the picker stays navigable.

import { efArbutus } from "./ef-arbutus.ts";
import { efArcadia } from "./ef-arcadia.ts";
import { efAtlantis } from "./ef-atlantis.ts";
import { efAutumn } from "./ef-autumn.ts";
import { efBio } from "./ef-bio.ts";
import { efCherie } from "./ef-cherie.ts";
import { efCyprus } from "./ef-cyprus.ts";
import { efDark } from "./ef-dark.ts";
import { efDay } from "./ef-day.ts";
import { efDeuteranopiaDark } from "./ef-deuteranopia-dark.ts";
import { efDeuteranopiaLight } from "./ef-deuteranopia-light.ts";
import { efDream } from "./ef-dream.ts";
import { efDuoDark } from "./ef-duo-dark.ts";
import { efDuoLight } from "./ef-duo-light.ts";
import { efEagle } from "./ef-eagle.ts";
import { efEleaDark } from "./ef-elea-dark.ts";
import { efEleaLight } from "./ef-elea-light.ts";
import { efFig } from "./ef-fig.ts";
import { efFrost } from "./ef-frost.ts";
import { efKassio } from "./ef-kassio.ts";
import { efLight } from "./ef-light.ts";
import { efMarisDark } from "./ef-maris-dark.ts";
import { efMarisLight } from "./ef-maris-light.ts";
import { efMelissaDark } from "./ef-melissa-dark.ts";
import { efMelissaLight } from "./ef-melissa-light.ts";
import { efNight } from "./ef-night.ts";
import { efOrange } from "./ef-orange.ts";
import { efOwl } from "./ef-owl.ts";
import { efReverie } from "./ef-reverie.ts";
import { efRosa } from "./ef-rosa.ts";
import { efSpring } from "./ef-spring.ts";
import { efSummer } from "./ef-summer.ts";
import { efSymbiosis } from "./ef-symbiosis.ts";
import { efTrioDark } from "./ef-trio-dark.ts";
import { efTrioLight } from "./ef-trio-light.ts";
import { efTritanopiaDark } from "./ef-tritanopia-dark.ts";
import { efTritanopiaLight } from "./ef-tritanopia-light.ts";
import { efWinter } from "./ef-winter.ts";
import { modusOperandi } from "./modus-operandi.ts";
import { modusVivendi } from "./modus-vivendi.ts";
import type { Preset, ThemeDoc } from "./types.ts";

/** Presets grouped by family, for a grouped picker. Order = display order. */
export const PRESET_GROUPS: readonly { label: string; presets: readonly Preset[] }[] = [
  {
    label: "Modus",
    presets: [
      { id: "modus-operandi", label: "Modus Operandi (light)", doc: modusOperandi },
      { id: "modus-vivendi", label: "Modus Vivendi (dark)", doc: modusVivendi },
    ],
  },
  {
    label: "Ef — light",
    presets: [
      { id: "ef-arbutus", label: "Ef Arbutus (light)", doc: efArbutus },
      { id: "ef-arcadia", label: "Ef Arcadia (light)", doc: efArcadia },
      { id: "ef-cyprus", label: "Ef Cyprus (light)", doc: efCyprus },
      { id: "ef-day", label: "Ef Day (light)", doc: efDay },
      { id: "ef-deuteranopia-light", label: "Ef Deuteranopia Light", doc: efDeuteranopiaLight },
      { id: "ef-duo-light", label: "Ef Duo Light", doc: efDuoLight },
      { id: "ef-eagle", label: "Ef Eagle (light)", doc: efEagle },
      { id: "ef-elea-light", label: "Ef Elea Light", doc: efEleaLight },
      { id: "ef-frost", label: "Ef Frost (light)", doc: efFrost },
      { id: "ef-kassio", label: "Ef Kassio (light)", doc: efKassio },
      { id: "ef-light", label: "Ef Light", doc: efLight },
      { id: "ef-maris-light", label: "Ef Maris Light", doc: efMarisLight },
      { id: "ef-melissa-light", label: "Ef Melissa Light", doc: efMelissaLight },
      { id: "ef-orange", label: "Ef Orange (light)", doc: efOrange },
      { id: "ef-reverie", label: "Ef Reverie (light)", doc: efReverie },
      { id: "ef-spring", label: "Ef Spring (light)", doc: efSpring },
      { id: "ef-summer", label: "Ef Summer (light)", doc: efSummer },
      { id: "ef-trio-light", label: "Ef Trio Light", doc: efTrioLight },
      { id: "ef-tritanopia-light", label: "Ef Tritanopia Light", doc: efTritanopiaLight },
    ],
  },
  {
    label: "Ef — dark",
    presets: [
      { id: "ef-atlantis", label: "Ef Atlantis (dark)", doc: efAtlantis },
      { id: "ef-autumn", label: "Ef Autumn (dark)", doc: efAutumn },
      { id: "ef-bio", label: "Ef Bio (dark)", doc: efBio },
      { id: "ef-cherie", label: "Ef Cherie (dark)", doc: efCherie },
      { id: "ef-dark", label: "Ef Dark", doc: efDark },
      { id: "ef-deuteranopia-dark", label: "Ef Deuteranopia Dark", doc: efDeuteranopiaDark },
      { id: "ef-dream", label: "Ef Dream (dark)", doc: efDream },
      { id: "ef-duo-dark", label: "Ef Duo Dark", doc: efDuoDark },
      { id: "ef-elea-dark", label: "Ef Elea Dark", doc: efEleaDark },
      { id: "ef-fig", label: "Ef Fig (dark)", doc: efFig },
      { id: "ef-maris-dark", label: "Ef Maris Dark", doc: efMarisDark },
      { id: "ef-melissa-dark", label: "Ef Melissa Dark", doc: efMelissaDark },
      { id: "ef-night", label: "Ef Night (dark)", doc: efNight },
      { id: "ef-owl", label: "Ef Owl (dark)", doc: efOwl },
      { id: "ef-rosa", label: "Ef Rosa (dark)", doc: efRosa },
      { id: "ef-symbiosis", label: "Ef Symbiosis (dark)", doc: efSymbiosis },
      { id: "ef-trio-dark", label: "Ef Trio Dark", doc: efTrioDark },
      { id: "ef-tritanopia-dark", label: "Ef Tritanopia Dark", doc: efTritanopiaDark },
      { id: "ef-winter", label: "Ef Winter (dark)", doc: efWinter },
    ],
  },
];

// Flat list of all presets, used internally for lookup by id.
const PRESETS: readonly Preset[] = PRESET_GROUPS.flatMap((g) => g.presets);

export const DEFAULT_PRESET_ID = "modus-operandi";

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** Deep clone a ThemeDoc so edits never mutate the bundled preset. */
export function cloneDoc(doc: ThemeDoc): ThemeDoc {
  return {
    meta: { ...doc.meta },
    palette: { ...doc.palette },
    mappings: { ...doc.mappings },
  };
}
