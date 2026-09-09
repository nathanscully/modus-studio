;;; bogus-operandi-theme.el --- Grayscale version of modus-operandi theme -*- lexical-binding:t -*-

;; Copyright (c) ?

;; URL: https://github.com/andiogenes/bogus-themes
;; Keywords: faces, theme

;;; Code:



(eval-and-compile
  (unless (and (fboundp 'require-theme)
               load-file-name
               (equal (file-name-directory load-file-name)
                      (expand-file-name "themes/" data-directory))
               (require-theme 'modus-themes t))
    (require 'modus-themes))

;;;###theme-autoload
  (deftheme bogus-operandi
    "Elegant, highly legible theme with a white background.
Conforms with the highest legibility standard for color contrast
between background and foreground in any given piece of text,
which corresponds to a minimum contrast in relative luminance of
7:1 (WCAG AAA standard)."
    :background-mode 'light
    :kind 'color-scheme
    :family 'modus)

  (defconst bogus-operandi-palette
    '(
;;; Basic values

      (bg-main          "#ffffff")
      (bg-dim           "#f2f2f2")
      (fg-main          "#000000")
      (fg-dim           "#595959")
      (fg-alt           "#2c2c2c")
      (bg-active        "#c4c4c4")
      (bg-inactive      "#e0e0e0")
      (border           "#9f9f9f")

;;; Common accent foregrounds

      (red             "#373737")
      (red-warmer      "#4b4b4b")
      (red-cooler      "#424242")
      (red-faint       "#2a2a2a")
      (red-intense     "#454545")
      (green           "#454545")
      (green-warmer    "#535353")
      (green-cooler    "#444444")
      (green-faint     "#434343")
      (green-intense   "#5b5b5b")
      (yellow          "#5d5d5d")
      (yellow-warmer   "#5e5e5e")
      (yellow-cooler   "#5d5d5d")
      (yellow-faint    "#4e4e4e")
      (yellow-intense  "#808080")
      (blue            "#202020")
      (blue-warmer     "#414141")
      (blue-cooler     "#000000")
      (blue-faint      "#222222")
      (blue-intense    "#000000")
      (magenta         "#303030")
      (magenta-warmer  "#2f2f2f")
      (magenta-cooler  "#2d2d2d")
      (magenta-faint   "#4a4a4a")
      (magenta-intense "#606060")
      (cyan            "#3e3e3e")
      (cyan-warmer     "#4f4f4f")
      (cyan-cooler     "#3f3f3f")
      (cyan-faint      "#353535")
      (cyan-intense    "#5a5a5a")

;;; Uncommon accent foregrounds

      (rust       "#494949")
      (gold       "#6a6a6a")
      (olive      "#626262")
      (slate      "#393939")
      (indigo     "#3f3f3f")
      (maroon     "#393939")
      (pink       "#555555")

;;; Common accent backgrounds

      (bg-red-intense     "#b4b4b4")
      (bg-green-intense   "#c2c2c2")
      (bg-yellow-intense  "#dbdbdb")
      (bg-blue-intense    "#c5c5c5")
      (bg-magenta-intense "#b5b5b5")
      (bg-cyan-intense    "#c4c4c4")

      (bg-red-subtle      "#dfdfdf")
      (bg-green-subtle    "#e2e2e2")
      (bg-yellow-subtle   "#f8f8f8")
      (bg-blue-subtle     "#d8d8d8")
      (bg-magenta-subtle  "#e8e8e8")
      (bg-cyan-subtle     "#dfdfdf")

      (bg-red-nuanced     "#efefef")
      (bg-green-nuanced   "#eeeeee")
      (bg-yellow-nuanced  "#f2f2f2")
      (bg-blue-nuanced    "#ececec")
      (bg-magenta-nuanced "#ececec")
      (bg-cyan-nuanced    "#ececec")

;;; Uncommon accent background and foreground pairs

      (bg-clay     "#d5d5d5")
      (fg-clay     "#313131")

      (bg-ochre    "#e7e7e7")
      (fg-ochre    "#434343")

      (bg-lavender "#d3d3d3")
      (fg-lavender "#383838")

      (bg-sage     "#dadada")
      (fg-sage     "#383838")

;;; Graphs

      (bg-graph-red-0     "#a0a0a0")
      (bg-graph-red-1     "#c6c6c6")
      (bg-graph-green-0   "#979797")
      (bg-graph-green-1   "#c6c6c6")
      (bg-graph-yellow-0  "#dfdfdf")
      (bg-graph-yellow-1  "#fdfdfd")
      (bg-graph-blue-0    "#8a8a8a")
      (bg-graph-blue-1    "#b7b7b7")
      (bg-graph-magenta-0 "#9f9f9f")
      (bg-graph-magenta-1 "#dedede")
      (bg-graph-cyan-0    "#b2b2b2")
      (bg-graph-cyan-1    "#d9d9d9")

;;; Special purpose

      (bg-completion       "#d4d4d4")
      (bg-hover            "#d3d3d3")
      (bg-hover-secondary  "#dcdcdc")
      (bg-hl-line          "#e1e1e1")
      (bg-region           "#bdbdbd")
      (fg-region           "#000000")

      (bg-mode-line-active        "#c8c8c8")
      (fg-mode-line-active        "#000000")
      (border-mode-line-active    "#5a5a5a")
      (bg-mode-line-inactive      "#e6e6e6")
      (fg-mode-line-inactive      "#585858")
      (border-mode-line-inactive  "#a3a3a3")

      (modeline-err     "#2a2a2a")
      (modeline-warning "#1f1f1f")
      (modeline-info    "#181818")

      (bg-tab-bar      "#dfdfdf")
      (bg-tab-current  "#ffffff")
      (bg-tab-other    "#c2c2c2")

;;; Diffs

      (bg-added           "#e1e1e1")
      (bg-added-faint     "#ededed")
      (bg-added-refine    "#d2d2d2")
      (bg-added-fringe    "#a4a4a4")
      (fg-added           "#353535")
      (fg-added-intense   "#444444")

      (bg-changed         "#e9e9e9")
      (bg-changed-faint   "#f4f4f4")
      (bg-changed-refine  "#d3d3d3")
      (bg-changed-fringe  "#c9c9c9")
      (fg-changed         "#454545")
      (fg-changed-intense "#575757")

      (bg-removed         "#e5e5e5")
      (bg-removed-faint   "#f0f0f0")
      (bg-removed-refine  "#c9c9c9")
      (bg-removed-fringe  "#797979")
      (fg-removed         "#3c3c3c")
      (fg-removed-intense "#4f4f4f")

      (bg-diff-context    "#f3f3f3")

;;; Mappings

;;;; General mappings

      (fringe bg-dim)
      (cursor fg-main)

      (keybind blue-cooler)
      (name magenta)
      (identifier yellow-cooler)

      (err red)
      (warning yellow-warmer)
      (info cyan-cooler)

      (underline-err red-intense)
      (underline-warning yellow-intense)
      (underline-note cyan-intense)

      (bg-prominent-err bg-red-intense)
      (fg-prominent-err fg-main)
      (bg-prominent-warning bg-yellow-intense)
      (fg-prominent-warning fg-main)
      (bg-prominent-note bg-cyan-intense)
      (fg-prominent-note fg-main)

      (bg-active-argument bg-yellow-nuanced)
      (fg-active-argument yellow-warmer)
      (bg-active-value bg-cyan-nuanced)
      (fg-active-value cyan-warmer)

;;;; Code mappings

      (bracket fg-main)
      (builtin magenta-warmer)
      (comment fg-dim)
      (constant blue-cooler)
      (delimiter fg-main)
      (docmarkup magenta-faint)
      (docstring green-faint)
      (fnname magenta)
      (keyword magenta-cooler)
      (number fg-main)
      (operator fg-main)
      (preprocessor red-cooler)
      (punctuation fg-main)
      (rx-backslash magenta)
      (rx-construct green-cooler)
      (string blue-warmer)
      (type cyan-cooler)
      (variable cyan)

;;;; Paren match

      (bg-paren-match        bg-cyan-subtle)
      (fg-paren-match        fg-main)
      (underline-paren-match unspecified)
      (bg-paren-expression   bg-yellow-nuanced)

;;;; Accent mappings

      (accent-0 blue)
      (accent-1 magenta-warmer)
      (accent-2 cyan)
      (accent-3 red)

;;;; Button mappings

      (fg-button-active fg-main)
      (fg-button-inactive fg-dim)
      (bg-button-active bg-active)
      (bg-button-inactive bg-dim)

;;;; Completion mappings

      (fg-completion-match-0 blue)
      (fg-completion-match-1 magenta-warmer)
      (fg-completion-match-2 cyan)
      (fg-completion-match-3 red)
      (bg-completion-match-0 unspecified)
      (bg-completion-match-1 unspecified)
      (bg-completion-match-2 unspecified)
      (bg-completion-match-3 unspecified)

;;;; Date mappings

      (date-common cyan)
      (date-deadline red-cooler)
      (date-deadline-subtle red-faint)
      (date-event fg-alt)
      (date-holiday red)
      (date-holiday-other blue)
      (date-now fg-main)
      (date-range fg-alt)
      (date-scheduled yellow)
      (date-scheduled-subtle yellow-faint)
      (date-weekday cyan)
      (date-weekend magenta)

;;;; Line number mappings

      (fg-line-number-inactive fg-dim)
      (fg-line-number-active fg-main)
      (bg-line-number-inactive bg-dim)
      (bg-line-number-active bg-active)

;;;; Link mappings

      (fg-link blue-warmer)
      (bg-link unspecified)
      (underline-link blue-warmer)

      (fg-link-symbolic cyan)
      (bg-link-symbolic unspecified)
      (underline-link-symbolic cyan)

      (fg-link-visited magenta)
      (bg-link-visited unspecified)
      (underline-link-visited magenta)

;;;; Mail mappings

      (mail-cite-0 blue-faint)
      (mail-cite-1 yellow-warmer)
      (mail-cite-2 cyan-cooler)
      (mail-cite-3 red-cooler)
      (mail-part cyan)
      (mail-recipient magenta-cooler)
      (mail-subject magenta-warmer)
      (mail-other magenta-faint)

;;;; Mark mappings

      (bg-mark-delete bg-red-subtle)
      (fg-mark-delete red)
      (bg-mark-select bg-cyan-subtle)
      (fg-mark-select cyan)
      (bg-mark-other bg-yellow-subtle)
      (fg-mark-other yellow)

;;;; Prompt mappings

      (fg-prompt cyan-cooler)
      (bg-prompt unspecified)

;;;; Prose mappings

      (bg-prose-block-delimiter bg-dim)
      (fg-prose-block-delimiter fg-dim)
      (bg-prose-block-contents bg-dim)

      (bg-prose-code unspecified)
      (fg-prose-code cyan-cooler)

      (bg-prose-macro unspecified)
      (fg-prose-macro magenta-cooler)

      (bg-prose-verbatim unspecified)
      (fg-prose-verbatim magenta-warmer)

      (prose-done green)
      (prose-todo red)

      (prose-metadata fg-dim)
      (prose-metadata-value fg-alt)

      (prose-table fg-alt)
      (prose-table-formula magenta-warmer)

      (prose-tag magenta-faint)

;;;; Rainbow mappings

      (rainbow-0 fg-main)
      (rainbow-1 magenta-intense)
      (rainbow-2 cyan-intense)
      (rainbow-3 red-warmer)
      (rainbow-4 yellow-intense)
      (rainbow-5 magenta-cooler)
      (rainbow-6 green-intense)
      (rainbow-7 blue-warmer)
      (rainbow-8 magenta-warmer)

;;;; Search mappings

      (bg-search-current bg-yellow-intense)
      (bg-search-lazy bg-cyan-intense)
      (bg-search-replace bg-red-intense)

      (bg-search-rx-group-0 bg-blue-intense)
      (bg-search-rx-group-1 bg-green-intense)
      (bg-search-rx-group-2 bg-red-subtle)
      (bg-search-rx-group-3 bg-magenta-subtle)

;;;; Space mappings

      (bg-space unspecified)
      (fg-space border)
      (bg-space-err bg-red-intense)

;;;; Terminal mappings

      (bg-term-black           "#000000")
      (fg-term-black           "#000000")
      (bg-term-black-bright    "#595959")
      (fg-term-black-bright    "#595959")

      (bg-term-red             red)
      (fg-term-red             red)
      (bg-term-red-bright      red-warmer)
      (fg-term-red-bright      red-warmer)

      (bg-term-green           green)
      (fg-term-green           green)
      (bg-term-green-bright    green-cooler)
      (fg-term-green-bright    green-cooler)

      (bg-term-yellow          yellow)
      (fg-term-yellow          yellow)
      (bg-term-yellow-bright   yellow-warmer)
      (fg-term-yellow-bright   yellow-warmer)

      (bg-term-blue            blue)
      (fg-term-blue            blue)
      (bg-term-blue-bright     blue-warmer)
      (fg-term-blue-bright     blue-warmer)

      (bg-term-magenta         magenta)
      (fg-term-magenta         magenta)
      (bg-term-magenta-bright  magenta-cooler)
      (fg-term-magenta-bright  magenta-cooler)

      (bg-term-cyan            cyan)
      (fg-term-cyan            cyan)
      (bg-term-cyan-bright     cyan-cooler)
      (fg-term-cyan-bright     cyan-cooler)

      (bg-term-white           "#a6a6a6")
      (fg-term-white           "#a6a6a6")
      (bg-term-white-bright    "#ffffff")
      (fg-term-white-bright    "#ffffff")

;;;; Heading mappings

      (fg-heading-0 cyan-cooler)
      (fg-heading-1 fg-main)
      (fg-heading-2 yellow-faint)
      (fg-heading-3 fg-alt)
      (fg-heading-4 magenta)
      (fg-heading-5 green-faint)
      (fg-heading-6 red-faint)
      (fg-heading-7 cyan-warmer)
      (fg-heading-8 fg-dim)

      (bg-heading-0 unspecified)
      (bg-heading-1 unspecified)
      (bg-heading-2 unspecified)
      (bg-heading-3 unspecified)
      (bg-heading-4 unspecified)
      (bg-heading-5 unspecified)
      (bg-heading-6 unspecified)
      (bg-heading-7 unspecified)
      (bg-heading-8 unspecified)

      (overline-heading-0 unspecified)
      (overline-heading-1 unspecified)
      (overline-heading-2 unspecified)
      (overline-heading-3 unspecified)
      (overline-heading-4 unspecified)
      (overline-heading-5 unspecified)
      (overline-heading-6 unspecified)
      (overline-heading-7 unspecified)
      (overline-heading-8 unspecified))
    "The entire palette of the `bogus-operandi' theme.

Named colors have the form (COLOR-NAME HEX-VALUE) with the former
as a symbol and the latter as a string.

Semantic color mappings have the form (MAPPING-NAME COLOR-NAME)
with both as symbols.  The latter is a named color that already
exists in the palette and is associated with a HEX-VALUE.")

  (defcustom bogus-operandi-palette-user nil
    "Like the `bogus-operandi-palette' for user-defined entries.
This is meant to extend the palette with custom named colors and/or
semantic palette mappings.  Those may then be used in combination with
palette overrides (also see `modus-themes-common-palette-overrides' and
`bogus-operandi-palette-overrides')."
    :group 'modus-themes
    :package-version '(modus-themes . "4.5.0")
    :type '(repeat (list symbol (choice symbol string)))
    :set #'modus-themes--set-option
    :initialize #'custom-initialize-default
    :link '(info-link "(modus-themes) Option to extend the palette for use with overrides"))

  (defcustom bogus-operandi-palette-overrides nil
    "Overrides for `bogus-operandi-palette'.

Mirror the elements of the aforementioned palette, overriding
their value.

For overrides that are shared across all of the Modus themes,
refer to `modus-themes-common-palette-overrides'.

Theme-specific overrides take precedence over shared overrides.
The idea of common overrides is to change semantic color
mappings, such as to make the cursor red.  Wherea theme-specific
overrides can also be used to change the value of a named color,
such as what hexadecimal RGB value the red-warmer symbol
represents."
    :group 'modus-themes
    :package-version '(modus-themes . "4.0.0")
    :version "30.1"
    :type '(repeat (list symbol (choice symbol string)))
    :set #'modus-themes--set-option
    :initialize #'custom-initialize-default
    :link '(info-link "(modus-themes) Palette overrides"))

  (modus-themes-theme bogus-operandi
                      bogus-operandi-palette
                      bogus-operandi-palette-overrides)

  (provide-theme 'bogus-operandi))

;;; bogus-operandi-theme.el ends here
