;;; modern-ayu-dark-theme.el --- Ayu Dark theme port -*- lexical-binding:t -*-

;; Copyright (C) 2025  Free Software Foundation

;; Author: artawower33@gmail.com
;; Maintainer: artawower
;; URL: https://github.com/artawower/modern-themes
;; Keywords: faces, theme, accessibility

;; This file is NOT part of GNU Emacs.

;; GNU Emacs is free software...

;;; Commentary:
;;
;; The `modern-ayu-dark' theme is a port of the Ayu Dark color scheme
;; to the `modus-themes' structure.

;;; Code:

;;; modern-ayu-dark-theme.el --- Ayu Dark theme port -*- lexical-binding:t -*-

(require 'modus-themes)

(defconst modern-ayu-dark-palette-partial
  '(
    
    (cursor "#E6B450")
    (bg-main "#0D1017")
    (bg-dim  "#0B0E14")
    (bg-alt  "#131721")
    (fg-main "#BFBDB6")
    (fg-dim  "#565B66")
    (fg-alt  "#FF8F40")
    (bg-active "#2A3040")
    (bg-inactive "#0B0E14")
    (border      "#11151C")

    
    (red           "#D95757")
    (red-warmer    "#E66767")
    (red-cooler    "#C94747")
    (red-faint     "#B03737")

    (green         "#7FD962")
    (green-warmer  "#8FE772")
    (green-cooler  "#6FC952")
    (green-faint   "#5FB942")

    (yellow        "#E6B450")
    (yellow-warmer "#F4C260")
    (yellow-cooler "#D6A440")
    (yellow-faint  "#C69430")

    (blue          "#59C2FF")
    (blue-warmer   "#67D0FF")
    (blue-cooler   "#4BB2FF")
    (blue-faint    "#3DA2FF")

    (magenta        "#D2A6FF")
    (magenta-warmer "#E0B4FF")
    (magenta-cooler "#C496FF")
    (magenta-faint  "#B486FF")

    (cyan         "#39BAE6")
    (cyan-warmer  "#48C8F4")
    (cyan-cooler  "#2AACD8")
    (cyan-faint   "#1C9EC2")

    
    (bg-added         "#1A2E1A")
    (bg-added-faint   "#152515")
    (bg-added-refine  "#2A402A")

    (bg-changed        "#1A2433")
    (bg-changed-faint  "#141E28")
    (bg-changed-refine "#1F2A3D")

    (bg-removed        "#2E1A1A")
    (bg-removed-faint  "#251515")
    (bg-removed-refine "#3A2020")

    
    (bg-red-intense     "#331A1A")
    (bg-green-intense   "#1A2E1A")
    (bg-yellow-intense  "#2E281A")
    (bg-blue-intense    "#1A2433")
    (bg-magenta-intense "#2A1A33")
    (bg-cyan-intense    "#1A2A2E")

    (bg-red-subtle     "#2A1515")
    (bg-green-subtle   "#152A15")
    (bg-yellow-subtle  "#282215")
    (bg-blue-subtle    "#152033")
    (bg-magenta-subtle "#251533")
    (bg-cyan-subtle    "#152528")))

(defconst modern-ayu-dark-palette-common
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

    (fg-link-symbolic blue)
    (underline-link border)

    (border-mode-line-active border)
    (bg-mode-line-inactive bg-alt)
    (fg-mode-line-inactive fg-dim)

    (bg-line-number-active bg-alt)
    (fg-line-number-active fg-alt)))

(defconst modern-ayu-dark-palette-mappings-partial
  '(
    (err red)
    (warning yellow)
    (info blue)

    (bg-mode-line-active bg-active)
    (fg-mode-line-active fg-alt)

    (bg-completion bg-alt)
    (bg-hover bg-alt)
    (bg-hover-secondary bg-active)
    (bg-paren-match bg-main)
    (bg-err bg-main)
    (bg-warning bg-main)
    (bg-info bg-main)
    (bg-region bg-active)

    (builtin green)
    (comment fg-dim)
    (constant red)
    (fnname magenta)
    (fnname-call magenta)
    (keyword fg-alt)   
    (preprocessor green)
    (docstring cyan)
    (string cyan)
    (type yellow-warmer)
    (variable fg-main)
    (property fg-main)
    (variable-use fg-main)
    (rx-backslash magenta)
    (rx-construct red)

    (bg-mark-delete bg-err)
    (fg-mark-delete err)
    (bg-mark-select bg-info)
    (fg-mark-select info)
    (bg-mark-other bg-warning)
    (fg-mark-other warning)

    (fg-term-black fg-main)


    (rainbow-0 magenta)
    (rainbow-1 red)
    (rainbow-2 yellow)
    (rainbow-3 green)
    (rainbow-4 blue)
    (rainbow-5 cyan)
    (rainbow-6 magenta-warmer)
    (rainbow-7 green-warmer)
    (rainbow-8 blue-warmer)))

(defcustom modern-ayu-dark-palette-overrides nil
  "Overrides for `modern-ayu-dark-palette'."
  :group 'modern-ayu-dark
  :type '(repeat (list symbol (choice symbol string))))

(defconst modern-ayu-dark-palette
  (modus-themes-generate-palette
   modern-ayu-dark-palette-partial
   nil
   nil
   (append modern-ayu-dark-palette-mappings-partial
           modern-ayu-dark-palette-common)))

(modus-themes-theme
 'modern-ayu-dark
 'modern-ayu-dark
 "Ayu Dark theme port."
 'dark
 'modern-ayu-dark-palette
 nil
 'modern-ayu-dark-palette-overrides
 nil)

(provide 'modern-ayu-dark-theme)
;;; modern-ayu-dark-theme.el ends here
