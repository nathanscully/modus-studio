// What the preview asks the editor to reveal when the user clicks a surface.
//
// A clicked element is governed either by a layer-1 named color (edited in the
// Palette tab — e.g. bg-region, bg-hl-line, the diff backgrounds) or by a
// layer-2 semantic role (edited in the Mappings tab — e.g. keyword, fg-heading-0,
// bg-space). The discriminated target lets the Generator route to the correct
// tab and highlight the matching field.

import type { ColorKey, RoleKey } from "../../theme/palette-keys.ts";

export type InspectTarget = { kind: "color"; key: ColorKey } | { kind: "role"; key: RoleKey };

export type InspectFn = (target: InspectTarget) => void;
