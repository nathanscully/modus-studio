# Modus & Ef themes: architecture, palette generation, and our porting model

> **Purpose.** This document captures what we learned while adding the ef-summer
> preset and verifying exported themes against real Emacs. It explains how the
> Modus theme engine works, how derivative themes (ef-themes) are built on top of
> it via `modus-themes-generate-palette`, the **API version differences** that
> matter, and how our generator's data model and exporter relate to all of this.
> Use it as the factual base for planning the next phase (e.g. a Solarized-style
> "8/16 base colors → full palette" import flow).

Upstream sources referenced throughout:

- Modus engine (latest): `https://github.com/protesilaos/modus-themes/blob/main/modus-themes.el`
- Ef theme example: `https://github.com/protesilaos/ef-themes/blob/main/ef-summer-theme.el`
- Ef shared mappings: `https://github.com/protesilaos/ef-themes/blob/main/ef-themes.el` (`ef-themes-palette-common`)
- Manual §10.1.4 "Complete example that also uses `modus-themes-generate-palette`": `https://protesilaos.com/emacs/modus-themes`
- Released/bundled copy used for verification: `/Applications/Emacs.app/Contents/Resources/etc/themes/` (Emacs 30.2)

Line numbers below are from the upstream `main` checkout we fetched on 2026-06-26;
treat them as approximate anchors, not stable references.

---

## 1. The two-layer palette model

A Modus theme palette is a single alist with two kinds of entries:

- **Layer 1 — named colors**: `(NAME "#hex")`, e.g. `(red-warmer "#972500")`. The
  value is a **string**.
- **Layer 2 — semantic mappings**: `(ROLE COLOR-NAME)`, e.g. `(keyword magenta-cooler)`.
  The value is a **symbol** (a named color, _or another role_ — see §4).

The engine distinguishes the two layers purely by value type: `stringp` ⇒ color,
`symbolp` ⇒ mapping. This is visible in `modus-themes-generate-palette`'s final
assembly (modus-themes.el `main` ~L7773):

```elisp
(named-values   (seq-filter (lambda (e) (stringp (cadr e))) no-duplicates))
(mapping-values (seq-filter (lambda (e) (symbolp (cadr e))) no-duplicates))
```

The **face specs** (defined once in `modus-themes.el`, not per theme) reference
both named colors and role symbols directly. So at load time every symbol a face
spec touches must be bound, or you get `void-variable`. This is the single most
important fact for our exporter (see §6).

Counts (approximate, version-dependent):

- ~120–128 named colors in a complete core palette
- ~170 semantic role symbols

---

## 2. `modus-themes-theme`: the API changed across versions

This caused real, load-breaking bugs during verification. There are **two
incompatible signatures** in the wild:

**Released / bundled with Emacs 30.2** — a **macro**, 3 args
(`/Applications/Emacs.app/Contents/Resources/etc/themes/modus-themes.el` ~L4108):

```elisp
(defmacro modus-themes-theme (name palette &optional overrides) ...)
```

A bundled theme file calls it with **unquoted symbols** inside an
`eval-and-compile` + `deftheme` wrapper (`modus-operandi-theme.el`):

```elisp
(eval-and-compile
  (unless (and (fboundp 'require-theme) ... (require-theme 'modus-themes t))
    (require 'modus-themes))
  (deftheme modus-operandi "..." :background-mode 'light :kind 'color-scheme :family 'modus)
  (defconst modus-operandi-palette '( ... ))
  (defcustom modus-operandi-palette-overrides nil ...)
  (modus-themes-theme modus-operandi
                      modus-operandi-palette
                      modus-operandi-palette-overrides)
  (provide-theme 'modus-operandi))
```

**Upstream `main`** — a **function**, 7+ args (modus-themes.el `main` ~L7341):

```elisp
(defun modus-themes-theme
    (name family description background-mode core-palette user-palette overrides-palette
     &optional custom-faces custom-variables) ...)
```

ef-summer (which tracks `main`) calls the 7-arg form with quoted symbols:

```elisp
(modus-themes-theme
 'ef-summer 'ef-themes "Legible light warm pink theme..." 'light
 'ef-summer-palette nil 'ef-summer-palette-overrides)
```

**Implication for us:** our exporter targets the **released/bundled macro** (3-arg,
unquoted, `deftheme`-wrapped) because that is what a stock Emacs ≥30 user has. See
`src/theme/export-el.ts` `exportThemeFile`. If we ever target `main`, the emitted
call shape must change.

---

## 3. `modus-themes-generate-palette`: how a small base becomes a full palette

Signature (modus-themes.el `main` ~L7577):

```elisp
(defun modus-themes-generate-palette
    (base-colors &optional cool-or-warm-preference core-palette mappings) ...)
```

Per the manual (§10.1.4) and the implementation:

- **BASE-COLORS** (required): an alist of `(NAME "#hex")`. The only mandatory
  entries are `bg-main` and `fg-main`. Anything already present is taken as-is;
  everything else is **derived**.
- **COOL-OR-WARM-PREFERENCE** (optional `'cool` / `'warm`): biases derived hues.
  If nil, inferred from whether `bg-main` is closer to blue (cool) or red (warm).
- **CORE-PALETTE** (optional symbol): palette to fill any remaining entries from.
  If nil, inferred: light `bg-main` → `modus-themes-operandi-palette`,
  dark → `modus-themes-vivendi-palette` (tinted variants when warm/cool implies).
- **MAPPINGS** (optional): `(ROLE COLOR-NAME)` overrides that take precedence over
  derived/core mappings.

### Derivation formulas (the actual math)

From the `push-derived-value-fn` calls (modus-themes.el `main` ~L7649–7666). Each
uses `modus-themes-adjust-value` (a luminance shift) and the warmer/cooler
generators. `bg-main-dark-p` selects the sign:

```elisp
;; Base entries derived from bg-main / fg-main:
(bg-dim      = adjust(bg-main, +5/-5))     ; +5 dark, -5 light
(bg-active   = adjust(bg-main, +10/-10))
(bg-inactive = adjust(bg-main, +8/-8))
(border      = adjust(bg-main, +20/-20))
(fg-dim      = adjust(fg-main, -20/+20))
(fg-alt      = warmer-or-cooler(adjust(fg-main, -10/+10), 0.8, prefers-cool-p))

;; For each of the six hues (red green yellow blue magenta cyan):
(<hue>-warmer  = adjust(warmer(value, 0.9), +20/-20))
(<hue>-cooler  = adjust(cooler(value, 0.9), +20/-20))
(<hue>-faint   = adjust(value, +10/-10))
(<hue>-intense = adjust(value, -5/+5))
(bg-<hue>-intense = adjust(value, -40/+40))
(bg-<hue>-subtle  = adjust(value, -60/+60))
(bg-<hue>-nuanced = adjust(value, -80/+80))
```

It also derives **default semantic mappings** (`push-mapping-fn`, ~L7666+), e.g.:

```elisp
(bg-completion = prefers-cool ? bg-cyan-subtle : bg-yellow-subtle)
(bg-hl-line    = prefers-cool ? bg-cyan-nuanced : bg-yellow-nuanced)
(bg-region     = bg-active)
(bg-mode-line-active = bg-active) (fg-mode-line-active = fg-main) ...
(modeline-err  = red-faint) ...
```

### Final assembly + dedup (modus-themes.el `main` ~L7758)

```elisp
(let* ((new-colors   (append base-colors derived-colors))
       (new-mappings (append mappings derived-mappings))
       (core (or core-palette (<inferred operandi/vivendi/tinted>)))
       (combined-new-palette (append new-colors new-mappings core))
       (no-duplicates (seq-uniq combined-new-palette
                                (lambda (a b) (eq (car a) (car b))))))
  ;; split back into named-values (stringp) then mapping-values (symbolp)
  (append named-values mapping-values))
```

Key consequences:

- **Precedence is by first occurrence** (`seq-uniq` keeps the first): your
  BASE-COLORS/MAPPINGS win, then derived, then CORE-PALETTE fills the gaps.
- The CORE-PALETTE guarantees **completeness** — that is why a generated palette
  never has `void-variable` holes: anything you didn't provide and the algorithm
  didn't derive is taken from operandi/vivendi.

### Worked numbers (ef-summer)

Running ef-summer's `ef-summer-palette-partial` (70 colors) through the real
function in Emacs produced **113 named colors** — so only ~43 were derived. The
previously-absent foreground intense hues came out as, e.g.,
`red-intense #d63a44`, `green-intense #22803f`, `magenta-intense #c437b8`.

---

## 4. Role → role indirection

Some mappings point a role at **another role**, not a named color. ef-themes do
this heavily via `ef-themes-palette-common` (ef-themes.el):

```elisp
(fg-completion-match-0 accent-0)   ; accent-0 is itself a mapping
(fg-heading-0 rainbow-0)           ; rainbow-0 is itself a mapping
(fg-line-number-active accent-0)
```

The engine resolves these by chaining. Our `resolveValue` (`src/theme/resolve.ts`)
was extended to do the same with cycle protection: a value that is a `RoleKey`
resolves through that role's mapping. Verified end-to-end:
`fg-heading-0 → rainbow-0 → magenta-warmer → #cb1aaa`.

---

## 5. How ef-summer is actually built (vs. the manual's minimal Solarized example)

ef-summer uses the **same** `modus-themes-generate-palette` call shape as the
manual's Solarized walkthrough (§10.1.4), but feeds it far more
(`ef-summer-theme.el` ~L218):

```elisp
(defconst ef-summer-palette
  (modus-themes-generate-palette
   ef-summer-palette-partial                                  ; BASE-COLORS: 70 colors
   nil                                                        ; COOL/WARM: auto
   nil                                                        ; CORE-PALETTE: auto
   (append ef-summer-palette-mappings-partial                 ; MAPPINGS: 73 theme-specific
           ef-themes-palette-common)))                        ;         + 57 ef-shared = 130
```

|                                      | Manual's minimal Solarized      | ef-summer (real)                     |
| ------------------------------------ | ------------------------------- | ------------------------------------ |
| Function                             | `modus-themes-generate-palette` | same                                 |
| BASE-COLORS                          | 8 (bg/fg + 6 hues)              | **70** (every variant pre-specified) |
| Colors left to derive                | ~112                            | ~43 (70 in → 113 out)                |
| MAPPINGS arg                         | ~8 tweaks                       | **130** (73 theme + 57 ef-common)    |
| Mappings applied _after_ generation? | no                              | **no — all via the 4th arg**         |

So ef-themes are _designed_ themes: they lean minimally on the algorithm
(pre-specifying most colors) and do heavy semantic remapping — but **everything is
fed into the single `generate-palette` call; nothing is patched afterward.**

ef-summer also adds **named colors Modus lacks**: `bg-alt`, `bg-err`, `bg-warning`,
`bg-info`, and treats `cursor` as a _named color_ (not just a mapping).

---

## 6. How our generator relates to all this

Our app does **not** run `modus-themes-generate-palette` at runtime. Instead:

- **`src/theme/modus-operandi.ts`, `modus-vivendi.ts`** — the core Modus palettes,
  transcribed **verbatim** from upstream `main`. Nothing generated; these are
  Prot's hand-authored values. (Note: a few values like `gold`/`olive` differ from
  the older copy bundled in Emacs 30.2 because we track `main`.)
- **`src/theme/ef-summer.ts`** — we ran ef-summer's partial through the **real**
  `modus-themes-generate-palette` in Emacs once, and **baked the 113-color output**
  - the merged mappings into the seed. So we store generate-palette's _result_,
    not its inputs.
- **`src/theme/palette-keys.ts`** — the vocabulary (ordered `ColorKey` / `RoleKey`
  unions). We added `bg-alt`, `bg-err`, `bg-warning`, `bg-info`, `bg-char-0..2`
  here to accommodate ef + the engine's references.
- **`src/theme/resolve.ts`** — resolves a role to hex; follows role→role chains
  (§4); `UNSPECIFIED` sentinel.
- **`src/theme/export-el.ts`** — emits a self-contained, **3-arg-macro / `deftheme`**
  theme file (§2). Two completeness guarantees that prevent `void-variable`:
  1. **Mappings:** emit _every_ `ROLE_GROUPS` key; default missing → `unspecified`;
     if a name is a defined palette color (e.g. `cursor`), emit its hex so the
     symbol is bound.
  2. **Colors:** `completePalette()` backfills any named color the doc lacks from
     the matching Modus base (operandi/vivendi by mode). This is our equivalent of
     generate-palette's CORE-PALETTE fill — it is what makes ported themes load.

### Verified end-to-end (real `emacs -Q`, Emacs 30.2 `ns` GUI frame)

Loading our exported `verify-ef-summer-theme.el` yielded exact-matching realized
face colors (e.g. `keyword #8e44f3`, `string #b6532f`, `cursor #cf0090`,
`default bg #fff2f3 fg #4f4073`), `LOADED OK`, theme enabled. Same procedure
confirmed Modus Operandi earlier (`keyword #ff0000` override round-tripped).

---

## 7. Implications for the next phase (Solarized-style imports)

The manual's §10.1.4 describes exactly the flow we'd want for a "bring your own
8/16 colors" importer. Two viable architectures:

**Option A — port the algorithm to TypeScript.** Reimplement
`modus-themes-generate-palette` (the formulas in §3 + `modus-themes-adjust-value`,
warmer/cooler generators) so the app can expand `{bg-main, fg-main, 6 hues}` into a
full palette **in the browser**, live. Highest value (true "type 8 colors, get a
theme" UX), but requires faithfully reproducing the luminance math and the
cool/warm inference.

**Option B — capture generation output (what we did for ef-summer).** Run inputs
through real Emacs once (offline), bake the result into a seed. Exact, zero runtime
cost, but not interactive and needs Emacs in the loop per preset.

Open questions to resolve when planning:

- Do we want **live** generation (Option A) or **curated** presets (Option B)?
- Which `modus-themes-theme` API do we target — keep the released 3-arg macro
  (max compatibility) or add a `main`/7-arg mode?
- Should the editor expose the _partial_ (author-style: base + overrides) view in
  addition to the current _fully-expanded_ view? The partial is how upstream
  themes are actually written and would map directly onto an import flow.
- For Option A, the helper functions to port (modus-themes.el `main`) are:
  - `modus-themes-adjust-value` (~L3695) — the core luminance shift
  - `modus-themes-color-dark-p` (~L4149) — light/dark decision for `bg-main`
  - `modus-themes-generate-color-warmer` (~L7537) / `-cooler` (~L7541)
  - `modus-themes-color-is-warm-or-cool-p` (~L7557) — cool/warm inference
  - `modus-themes-generate-color-warmer-or-cooler` (~L7563)

---

## 8. Quick reference: gotchas this investigation surfaced

- **`modus-themes-theme` arity differs by version** (3-arg macro bundled vs 7-arg
  function on `main`). Target the bundled macro for compatibility.
- A theme file needs the **`deftheme` form** and the `eval-and-compile` wrapper, or
  `load-theme` enables nothing.
- The palette must be **complete** — the engine's face specs reference the full set
  of named colors and role symbols. Missing → `void-variable` (we hit `bg-heading-0`,
  `bg-char-0`, `red-intense`, `modeline-err`, `cursor`, … in sequence).
- **`cursor`** straddles layers: a role in Modus, a named color in ef. Export must
  bind it either way.
- Role→role mappings (`fg-heading-0 → rainbow-0`) must be emitted as **bare
  symbols**, never quoted strings (`"rainbow-0"` is an elisp string, not a ref).
- Grammar/tooling aside (not theme-specific but in this repo): `web-tree-sitter`
  grammar ABI must match the runtime; built from source with matching CLI. Vite's
  partial `process` shim breaks `Language.load(path)` — pass a `Uint8Array`.
