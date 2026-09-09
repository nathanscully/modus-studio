;;; flexoki-dark-theme.el --- Dark theme with Flexoki colours -*- lexical-binding:t -*-

;; Copyright (C) 2025  Splinter Suidman

;; Author: Splinter Suidman
;; Maintainer: Splinter Suidman
;; URL: https://github.com/splintersuidman/flexoki-themes
;; Keywords: theme, flexoki

;;; Commentary:
;;
;; Themes for Emacs with colours from Flexoki and based on the Modus
;; themes.

;;; Code:

(eval-and-compile
  (require 'flexoki-themes)

  (defconst flexoki-themes-dark-palette-partial
    '((bg-main flexoki-dark-bg) (bg-dim flexoki-dark-bg-2)
      (fg-main flexoki-dark-text)
      (fg-dim flexoki-dark-text-2) (fg-alt flexoki-dark-text-3) (bg-active flexoki-dark-ui-2)
      (bg-inactive flexoki-dark-ui) (border flexoki-dark-ui-3)
      (red flexoki-dark-red) (red-warmer flexoki-red-300) (red-cooler flexoki-red-700)
      (red-faint flexoki-red-800) (red-intense flexoki-red-600)
      (orange flexoki-dark-orange) (orange-warmer flexoki-orange-300) (orange-cooler flexoki-orange-700)
      (orange-faint flexoki-orange-800) (orange-intense flexoki-orange-600)
      (green flexoki-dark-green) (green-warmer flexoki-green-300) (green-cooler flexoki-green-700)
      (green-faint flexoki-green-800) (green-intense flexoki-green-600)
      (yellow flexoki-dark-yellow) (yellow-warmer flexoki-yellow-300) (yellow-cooler flexoki-yellow-700)
      (yellow-faint flexoki-yellow-800) (yellow-intense flexoki-yellow-600)
      (blue flexoki-dark-blue) (blue-warmer flexoki-blue-300) (blue-cooler flexoki-blue-700)
      (blue-faint flexoki-blue-800) (blue-intense flexoki-blue-600)
      (magenta flexoki-dark-magenta) (magenta-warmer flexoki-magenta-300) (magenta-cooler flexoki-magenta-700)
      (magenta-faint flexoki-magenta-800) (magenta-intense flexoki-magenta-600)
      (cyan flexoki-dark-cyan) (cyan-warmer flexoki-cyan-300) (cyan-cooler flexoki-cyan-700)
      (cyan-faint flexoki-cyan-800) (cyan-intense flexoki-cyan-600)
      (purple flexoki-dark-purple) (purple-warmer flexoki-purple-300) (purple-cooler flexoki-purple-700)
      (purple-faint flexoki-purple-800) (purple-intense flexoki-purple-600)
      (bg-red-intense flexoki-red-900) (bg-red-subtle flexoki-red-950)
      (bg-orange-intense flexoki-orange-900) (bg-orange-subtle flexoki-orange-950)
      (bg-green-intense flexoki-green-900) (bg-green-subtle flexoki-green-950)
      (bg-yellow-intense flexoki-yellow-900) (bg-yellow-subtle flexoki-yellow-950)
      (bg-blue-intense flexoki-blue-900) (bg-blue-subtle flexoki-blue-950)
      (bg-magenta-intense flexoki-magenta-900) (bg-magenta-subtle flexoki-magenta-950)
      (bg-cyan-intense flexoki-cyan-900) (bg-cyan-subtle flexoki-cyan-950)
      (bg-purple-intense flexoki-purple-900) (bg-purple-subtle flexoki-purple-950)
      (bg-graph-red-0 red-faint) (bg-graph-red-1 red-intense) (bg-graph-green-0 green-faint)
      (bg-graph-green-1 green-intense) (bg-graph-yellow-0 yellow-faint)
      (bg-graph-yellow-1 yellow-intense) (bg-graph-blue-0 blue-faint)
      (bg-graph-blue-1 blue-intense) (bg-graph-magenta-0 magenta-faint)
      (bg-graph-magenta-1 magenta-intense) (bg-graph-cyan-0 cyan-faint)
      (bg-graph-cyan-1 cyan-intense)

      (bg-completion bg-inactive)
      (bg-hover cyan-cooler)
      (bg-hover-secondary magenta-cooler)
      (bg-hl-line bg-inactive)
      (bg-region bg-active)
      (fg-region unspecified)

      (modeline-err red-warmer)
      (modeline-warning magenta-warmer)
      (modeline-info blue-warmer)

      (bg-added bg-green-intense)
      (bg-added-faint bg-green-subtle)
      (bg-added-refine flexoki-green-850)
      (fg-added green-warmer)
      (fg-added-intense flexoki-green-200)
      (bg-changed bg-orange-intense)
      (bg-changed-faint bg-orange-subtle)
      (bg-changed-refine flexoki-orange-850)
      (fg-changed flexoki-orange-200)
      (fg-changed-intense flexoki-orange-800)
      (bg-removed bg-red-intense)
      (bg-removed-faint bg-red-subtle)
      (bg-removed-refine flexoki-red-850)
      (fg-removed flexoki-red-200)
      (fg-removed-intense flexoki-red-200)

      (cursor fg-main)

      (bg-paren bg-purple-intense)
      (underline-paren-match unspecified)
      (fg-paren-match fg-main)
      (underline-paren-match unspecified) 

      (err red)
      (warning yellow-warmer)
      (info blue)
      (bg-err bg-red-intense)
      (bg-warning bg-yellow-intense)
      (bg-info bg-cyan-intense)
      (underline-err err)
      (underline-warning warning)
      (underline-note info)

      (keybind blue)
      (name magenta)
      (identifier yellow)
      (prompt cyan)

      (builtin magenta)
      (comment fg-alt)
      (constant yellow)
      (docmarkup magenta-faint)
      (docstring cyan-warmer)
      (fnname magenta)
      (keyword green)
      (preprocessor red)
      (property blue)
      (string cyan)
      (type blue)
      (variable blue)

      (rx-escape magenta)
      (rx-construct green-cooler)

      (bracket fg-main)
      (delimiter fg-main)
      (docmarkup magenta-faint)
      (number purple)
      (operator fg-dim)
      (punctuation fg-dim)

      (accent-0 blue)
      (accent-1 magenta)
      (accent-2 cyan)
      (accent-3 red)

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

      (bg-link unspecified)
      (bg-link-symbolic unspecified)
      (bg-link-visited unspecified)
      (fg-link cyan)
      (fg-link-symbolic cyan)
      (fg-link-visited magenta)
      (underline-link cyan)
      (underline-link-symbolic cyan)
      (underline-link-visited magenta)

      (mail-cite-0 blue-faint)
      (mail-cite-1 yellow-warmer)
      (mail-cite-2 cyan-cooler)
      (mail-cite-3 red-cooler)
      (mail-part cyan)
      (mail-recipient magenta-cooler)
      (mail-subject magenta-warmer)
      (mail-other magenta-faint)

      (bg-mark-delete bg-red-subtle)
      (fg-mark-delete red)
      (bg-mark-select bg-cyan-subtle)
      (fg-mark-select cyan)
      (bg-mark-other bg-yellow-subtle)
      (fg-mark-other yellow)

      (bg-prose-block-contents bg-dim)
      (bg-prose-block-delimiter bg-dim)
      (bg-prose-code unspecified)
      (bg-prose-macro unspecified)
      (bg-prose-verbatim unspecified)
      (fg-prose-block-delimiter fg-dim)
      (fg-prose-code cyan-cooler)
      (fg-prose-macro magenta-cooler)
      (fg-prose-verbatim magenta-warmer)
      (prose-done green)
      (prose-metadata fg-dim)
      (prose-metadata-value fg-alt)
      (prose-table fg-alt)
      (prose-table-formula magenta-warmer)
      (prose-tag magenta-faint)
      (prose-todo red)

      (rainbow-0 green)
      (rainbow-1 blue)
      (rainbow-2 magenta)
      (rainbow-3 cyan)
      (rainbow-4 yellow)
      (rainbow-5 purple)
      (rainbow-6 red)
      (rainbow-7 orange)
      (rainbow-8 fg-dim)

      (bg-search-current bg-yellow-intense)
      (bg-search-lazy bg-cyan-intense)
      (bg-search-replace bg-red-intense)
      (bg-search-static bg-magenta-subtle)

      (bg-search-rx-group-0 bg-blue-intense)
      (bg-search-rx-group-1 bg-green-intense)
      (bg-search-rx-group-2 bg-red-subtle)
      (bg-search-rx-group-3 bg-magenta-subtle)

      (fg-button-active fg-main)
      (fg-button-inactive fg-dim)
      (bg-button-active bg-active)
      (bg-button-inactive bg-dim)

      (bg-space-err bg-red-intense))
    "Flexoki dark theme")

  (defcustom flexoki-themes-dark-palette-overrides nil
    "Overrides for `flexoki-themes-dark-palette'."
    :group 'flexoki-themes
    :type '(repeat (list symbol (choice symbol string))))

  (defconst flexoki-themes-dark-palette
    (append flexoki-themes-dark-palette-partial flexoki-themes-palette-common))

  (modus-themes-theme
    'flexoki-dark
    'flexoki-themes
    "Flexoki dark theme"
    'dark
    'modus-themes-vivendi-palette
    'flexoki-themes-dark-palette
    'flexoki-themes-dark-palette-overrides
    'flexoki-themes-faces))
