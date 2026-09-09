;;; modern-catppuccin-mocha-theme.el --- Catppuccin Mocha theme port -*- lexical-binding:t -*-

;; Copyright (C) 2025  Free Software Foundation, Inc.

;; Author: artawower33@gmail.com
;; Maintainer: artawower
;; URL: https://github.com/artawower/modern-themes
;; Keywords: faces, theme, accessibility

;; This file is NOT part of GNU Emacs.

;; GNU Emacs is free software: you can redistribute it and/or modify
;; it under the terms of the GNU General Public License as published by
;; the Free Software Foundation, either version 3 of the License, or
;; (at your option) any later version.
;;
;; GNU Emacs is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; GNU General Public License for more details.
;;
;; You should have received a copy of the GNU General Public License
;; along with GNU Emacs.  If not, see <https://www.gnu.org/licenses/>.

;;; Commentary:
;;
;; The `modern-catppuccin-mocha' theme is a port of the Catppuccin Mocha theme
;; to the `modus-themes' structure.

;;; Code:

(require 'modus-themes)

(defconst modern-catppuccin-mocha-palette-partial
  '((cursor "#f5e0dc")
    (bg-main "#1e1e2e")
    (bg-dim "#11111b")
    (bg-alt "#313244")
    (fg-main "#cdd6f4")
    (fg-dim "#6c7086")
    (fg-alt "#bac2de")
    (bg-active "#585b70")
    (bg-inactive "#181825")
    (border "#6c7086")

    (red "#f38ba8")
    (red-warmer "#eba0ac")
    (red-cooler "#f2cdcd")
    (red-faint "#c55877")
    (green "#a6e3a1")
    (green-warmer "#a6e3a1")
    (green-cooler "#94e2d5")
    (green-faint "#73b56d")
    (yellow "#f9e2af")
    (yellow-warmer "#fab387")
    (yellow-cooler "#f9e2af")
    (yellow-faint "#d0b16d")
    (blue "#89b4fa")
    (blue-warmer "#74c7ec")
    (blue-cooler "#b4befe")
    (blue-faint "#5482cd")
    (magenta "#cba6f7")
    (magenta-warmer "#f5c2e7")
    (magenta-cooler "#cba6f7")
    (magenta-faint "#9668cd")
    (cyan "#89dceb")
    (cyan-warmer "#94e2d5")
    (cyan-cooler "#74c7ec")
    (cyan-faint "#5aadbc")
    (teal "#94e2d5")

    (bg-red-intense "#5d3e52")
    (bg-green-intense "#465950")
    (bg-yellow-intense "#5f5854")
    (bg-blue-intense "#3e4b6b")
    (bg-magenta-intense "#51466a")
    (bg-cyan-intense "#3e5766")

    (bg-red-subtle "#3d2e40")
    (bg-green-subtle "#323b3f")
    (bg-yellow-subtle "#3e3b41")
    (bg-blue-subtle "#2e344c")
    (bg-magenta-subtle "#37324c")
    (bg-cyan-subtle "#2e3a4a")

    (bg-added         "#45475a")
    (bg-added-faint   "#313244")
    (bg-added-refine  "#5d7a5a")

    (bg-changed        "#45475a")
    (bg-changed-faint  "#313244")
    (bg-changed-refine "#8a7448")

    (bg-removed        "#45475a")
    (bg-removed-faint  "#313244")
    (bg-removed-refine "#8b4f5f")

    ;; Unique colors needed for mappings
    (bg-mode-line-active-col "#45475a") ;; Surface1
    (bg-hover-col "#585b70") ;; Surface2
    (bg-hover-secondary-col "#45475a") ;; Surface1
    (bg-paren-match-col "#6c7086") ;; Overlay0
    (fg-heading-0-col "#f38ba8") ;; Red
    (fg-heading-1-col "#fab387") ;; Peach
    (fg-heading-2-col "#f9e2af") ;; Yellow
    (fg-heading-3-col "#a6e3a1") ;; Green
    (fg-heading-4-col "#74c7ec") ;; Sapphire
    (fg-heading-5-col "#89b4fa") ;; Blue
    (fg-heading-6-col "#b4befe") ;; Lavender
    (fg-heading-7-col "#cba6f7") ;; Mauve
    (fg-heading-8-col "#f5c2e7"))) ;; Pink

(defconst modern-catppuccin-mocha-palette-common
  '((fringe unspecified)
    (fg-region unspecified)
    (fg-added unspecified)
    (fg-changed unspecified)
    (fg-removed unspecified)
    (fg-term-black fg-dim)
    (fg-term-black-bright fg-dim)
    (fg-term-white fg-dim)
    (fg-term-white-bright fg-main)

    (bg-diff-context bg-dim)

    (bg-tab-bar bg-alt)
    (bg-tab-current bg-main)
    (bg-tab-other bg-active)

    (fg-link-symbolic fg-alt)
    (underline-link border)
    (underline-link-symbolic border)

    (border-mode-line-active border)
    (bg-mode-line-inactive bg-alt)
    (fg-mode-line-inactive fg-dim)
    (border-mode-line-inactive border)

    (bg-line-number-active unspecified)
    (fg-line-number-active accent-0)
    (bg-line-number-inactive unspecified)

    (bg-prominent-err bg-err)
    (bg-prominent-warning bg-warning)
    (bg-prominent-note bg-info)
    (fg-prominent-err err)
    (fg-prominent-warning warning)
    (fg-prominent-note info)

    (bg-space unspecified)
    (fg-space border)

    (bg-active-argument bg-warning)
    (fg-active-argument warning)
    (bg-active-value bg-info)
    (fg-active-value info)

    (bg-mark-delete bg-err)
    (fg-mark-delete err)
    (bg-mark-select bg-info)
    (fg-mark-select info)
    (bg-mark-other bg-warning)
    (fg-mark-other warning)

    (fg-search-current bg-main)
    (fg-search-lazy fg-main)
    (fg-search-static fg-main)
    (fg-search-replace fg-main)

    (fg-search-rx-group-0 fg-main)
    (fg-search-rx-group-1 fg-main)
    (fg-search-rx-group-2 fg-main)
    (fg-search-rx-group-3 fg-main)

    (fg-completion-match-0 accent-0)
    (fg-completion-match-1 accent-1)
    (fg-completion-match-2 accent-2)
    (fg-completion-match-3 accent-3)

    (fg-heading-0 rainbow-0)
    (fg-heading-1 rainbow-1)
    (fg-heading-2 rainbow-2)
    (fg-heading-3 rainbow-3)
    (fg-heading-4 rainbow-4)
    (fg-heading-5 rainbow-5)
    (fg-heading-6 rainbow-6)
    (fg-heading-7 rainbow-7)
    (fg-heading-8 rainbow-8)))

(defconst modern-catppuccin-mocha-palette-mappings-partial
  '((err red)
    (warning yellow)
    (info blue)

    (bg-mode-line-active bg-mode-line-active-col)
    (fg-mode-line-active fg-main)

    (bg-completion bg-dim)
    (bg-hover bg-hover-col)
    (bg-hover-secondary bg-hover-secondary-col)
    (bg-hl-line bg-dim)
    (bg-paren-match bg-main)
    (bg-err bg-main)
    (bg-warning bg-main)
    (bg-info bg-main)
    (bg-region bg-active)

    (fg-link blue)
    (fg-link-visited blue-cooler)
    (name magenta)
    (keybind red)
    (identifier magenta-warmer)
    (fg-prompt magenta)

    (builtin red)
    (comment fg-dim)
    (constant yellow-warmer)
    (fnname blue)
    (fnname-call blue)
    (keyword magenta)
    (preprocessor red-faint)
    (docstring fg-dim)
    (string green)
    (type yellow)
    (variable fg-main)
    (property fg-main)
    (variable-use fg-main)
    (rx-backslash cyan-warmer)
    (rx-construct yellow-warmer)

    (accent-0 magenta)
    (accent-1 yellow)
    (accent-2 blue)
    (accent-3 red)

    (date-common cyan-warmer)
    (date-deadline red)
    (date-deadline-subtle red-faint)
    (date-event fg-alt)
    (date-holiday red-cooler)
    (date-now fg-main)
    (date-range fg-alt)
    (date-scheduled yellow)
    (date-scheduled-subtle yellow)
    (date-weekday cyan-warmer)
    (date-weekend red-faint)

    (fg-prose-code yellow)
    (prose-done green)
    (fg-prose-macro magenta)
    (prose-metadata fg-dim)
    (prose-metadata-value fg-alt)
    (prose-table fg-alt)
    (prose-table-formula info)
    (prose-tag yellow-warmer)
    (prose-todo red)
    (fg-prose-verbatim magenta)

    (mail-cite-0 yellow)
    (mail-cite-1 magenta)
    (mail-cite-2 blue)
    (mail-cite-3 cyan-warmer)
    (mail-part magenta-warmer)
    (mail-recipient magenta)
    (mail-subject fg-main)
    (mail-other magenta)

    (bg-search-static bg-warning)
    (bg-search-current yellow)
    (bg-search-lazy blue)
    (bg-search-replace red)

    (bg-search-rx-group-0 magenta)
    (bg-search-rx-group-1 green)
    (bg-search-rx-group-2 red)
    (bg-search-rx-group-3 cyan-warmer)

    (rainbow-0 fg-heading-0-col)
    (rainbow-1 fg-heading-1-col)
    (rainbow-2 fg-heading-2-col)
    (rainbow-3 fg-heading-3-col)
    (rainbow-4 fg-heading-4-col)
    (rainbow-5 fg-heading-5-col)
    (rainbow-6 fg-heading-6-col)
    (rainbow-7 fg-heading-7-col)
    (rainbow-8 fg-heading-8-col)))

(defcustom modern-catppuccin-mocha-palette-overrides nil
  "Overrides for `modern-catppuccin-mocha-palette'.

Mirror the elements of the aforementioned palette, overriding
their value.

To preview the palette entries, use `modus-themes-preview-colors' or
`modus-themes-preview-colors-current' (read the documentation for
further details)."
  :group 'modern-catppuccin-mocha
  :type '(repeat (list symbol (choice symbol string))))

(defconst modern-catppuccin-mocha-palette
  (modus-themes-generate-palette
   modern-catppuccin-mocha-palette-partial
   nil
   nil
   (append modern-catppuccin-mocha-palette-mappings-partial modern-catppuccin-mocha-palette-common)))

(defconst modern-catppuccin-mocha-custom-faces
  '(`(magit-section-highlight ((,c :background ,bg-alt)))
    `(magit-diff-file-heading-highlight ((,c :inherit magit-diff-file-heading :background ,bg-alt)))))

(modus-themes-theme
 'modern-catppuccin-mocha
 'modern-catppuccin-mocha
 "Catppuccin Mocha theme port."
 'dark
 'modern-catppuccin-mocha-palette
 nil
 'modern-catppuccin-mocha-palette-overrides
 'modern-catppuccin-mocha-custom-faces)

(provide 'modern-catppuccin-mocha-theme)
;;; modern-catppuccin-mocha-theme.el ends here
