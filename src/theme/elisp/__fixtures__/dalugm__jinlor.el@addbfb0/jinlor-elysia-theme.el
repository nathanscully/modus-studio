;;; jinlor-elysia-theme.el --- To Romantic Unfailing Elysia -*- lexical-binding: t -*-

;; Copyright (C) 2026 dalu
;; SPDX-License-Identifier: GPL-3.0-or-later

;;; Commentary:
;;
;; A dark theme centered on Elysia's rose-pink, with crystal blue,
;; lavender, pearl white, and restrained gold as secondary accents.

;;; Code:

(require 'jinlor)

(defconst jinlor-elysia-palette
  (modus-themes-generate-palette
   '((elysia-pink           "#e88fba")
     (elysia-pink-bright    "#ffb7d8")
     (elysia-rose           "#d66398")
     (elysia-crystal        "#8fd6e8")
     (elysia-crystal-bright "#b7edf5")
     (elysia-lilac          "#b49ad8")
     (elysia-lilac-bright   "#d4c1ec")
     (elysia-gold           "#e8c76d")
     (elysia-pearl          "#f8eef5")
     (bg-main               "#1c121b")
     (fg-main               "#f2eaf1")
     (bg-dim                "#251721")
     (fg-dim                "#aa9aaa")
     (bg-alt                "#321c2b")
     (fg-alt                "#e3aac4")
     (bg-active             "#573047")
     (bg-inactive           "#21151e")
     (red                   "#f06f88")
     (green                 "#80c9a4")
     (yellow                "#e8c76d")
     (blue                  "#82bee3")
     (magenta               "#e28fbe")
     (cyan                  "#88d3df")
     (bg-mode-line-active   "#d66398")
     (fg-mode-line-active   "#24131d")
     (bg-completion         "#462238")
     (bg-hover              "#2d4553")
     (bg-hl-line            "#291824")
     (bg-paren              "#563552")
     (bg-region             "#48283f")
     (border                "#71455e")
     (cursor                "#ffb7d8")
     (fg-intense            "#ffffff"))
   'cool
   nil
   (append
    '((cursor elysia-pink-bright)
      (name elysia-pink-bright)
      (keybind elysia-gold)
      (err red)
      (warning elysia-gold)
      (info elysia-crystal)
      (identifier elysia-pearl)
      (fg-prompt elysia-pink-bright)
      (builtin elysia-lilac)
      (comment fg-dim)
      (constant elysia-gold)
      (fnname elysia-pink)
      (fnname-call elysia-crystal)
      (keyword elysia-pink-bright)
      (preprocessor elysia-rose)
      (docstring elysia-crystal)
      (string elysia-crystal-bright)
      (type elysia-lilac-bright)
      (variable elysia-rose)
      (variable-use elysia-pink)
      (rx-backslash elysia-gold)
      (rx-construct elysia-lilac-bright)
      (accent-0 elysia-pink-bright)
      (accent-1 elysia-crystal-bright)
      (accent-2 elysia-lilac-bright)
      (accent-3 elysia-gold)
      (fg-link elysia-crystal-bright)
      (underline-link elysia-crystal)
      (fg-link-visited elysia-lilac-bright)
      (underline-link-visited elysia-lilac)
      (prose-code elysia-pink)
      (prose-done green)
      (prose-macro elysia-lilac-bright)
      (prose-tag elysia-gold)
      (prose-todo red)
      (prose-verbatim elysia-crystal-bright)
      (mail-cite-0 elysia-pink)
      (mail-cite-1 elysia-crystal)
      (mail-cite-2 elysia-lilac)
      (mail-cite-3 elysia-gold)
      (mail-recipient elysia-crystal-bright)
      (mail-subject elysia-pink-bright)
      (mail-other elysia-lilac)
      (rainbow-0 elysia-pink-bright)
      (rainbow-1 elysia-crystal)
      (rainbow-2 elysia-gold)
      (rainbow-3 elysia-lilac-bright)
      (rainbow-4 elysia-rose)
      (rainbow-5 elysia-crystal-bright)
      (rainbow-6 elysia-lilac)
      (rainbow-7 elysia-pink)
      (rainbow-8 elysia-gold))
    jinlor-common-palette-mappings))
  "Palette for `jinlor-elysia'.")

(defcustom jinlor-elysia-palette-overrides nil
  "Overrides for `jinlor-elysia-palette'."
  :group 'jinlor
  :package-version '(jinlor . "0.5.0")
  :type '(repeat (list symbol (choice symbol string))))

(modus-themes-theme
 'jinlor-elysia
 'jinlor
 "To Romantic Unfailing Elysia."
 'dark
 'modus-themes-vivendi-palette
 'jinlor-elysia-palette
 'jinlor-elysia-palette-overrides
 'jinlor-custom-faces)

;;; jinlor-elysia-theme.el ends here
