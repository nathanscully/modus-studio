;;; flexoki-themes.el --- Themes with Flexoki colours, based on Modus themes -*- lexical-binding:t -*-

;; Copyright (C) 2025  Splinter Suidman

;; Author: Splinter Suidman
;; Maintainer: Splinter Suidman
;; URL: https://github.com/splintersuidman/flexoki-themes
;; Version: 0.1.0
;; Package-Requires ((emacs "28.1") (modus-themes "4.8.1"))
;; Keywords: theme, flexoki

;;; Commentary:
;;
;; Themes for Emacs with colours from Flexoki and based on the Modus
;; themes.

;;; Code:

(require 'modus-themes)

(defgroup flexoki-themes ()
  "Flexoki themes"
  :group 'faces
  :group 'modus-themes
  :prefix "flexoki-themes-"
  :tag "Flexoki Themes")

(defconst flexoki-themes-palette-common
  '((flexoki-paper "#FFFCF0") (flexoki-black "#100F0F")
    (flexoki-base-50 "#F2F0E5") (flexoki-base-100 "#E6E4D9") (flexoki-base-150 "#DAD8CE")
    (flexoki-base-200 "#CECDC3") (flexoki-base-300 "#B7B5AC") (flexoki-base-400 "#9F9D96")
    (flexoki-base-500 "#878580") (flexoki-base-600 "#6F6E69") (flexoki-base-700 "#575653")
    (flexoki-base-800 "#403E3C") (flexoki-base-850 "#343331") (flexoki-base-900 "#282726")
    (flexoki-base-950 "#1C1B1A")
    (flexoki-red-50 "#FFE1D5") (flexoki-red-100 "#FFCABB") (flexoki-red-150 "#FDB2A2")
    (flexoki-red-200 "#F89A8A") (flexoki-red-300 "#E8705F") (flexoki-red-400 "#D14D41")
    (flexoki-red-500 "#C03E35") (flexoki-red-600 "#AF3029") (flexoki-red-700 "#942822")
    (flexoki-red-800 "#6C201C") (flexoki-red-850 "#551B18") (flexoki-red-900 "#3E1715")
    (flexoki-red-950 "#261312")
    (flexoki-orange-50 "#FFE7CE") (flexoki-orange-100 "#FED3AF") (flexoki-orange-150 "#FCC192")
    (flexoki-orange-200 "#F9AE77") (flexoki-orange-300 "#EC8B49") (flexoki-orange-400 "#DA702C")
    (flexoki-orange-500 "#CB6120") (flexoki-orange-600 "#BC5215") (flexoki-orange-700 "#9D4310")
    (flexoki-orange-800 "#71320D") (flexoki-orange-850 "#59290D") (flexoki-orange-900 "#40200D")
    (flexoki-orange-950 "#27180E")
    (flexoki-yellow-50 "#FAEEC6") (flexoki-yellow-100 "#F6E2A0") (flexoki-yellow-150 "#F1D67E")
    (flexoki-yellow-200 "#ECCB60") (flexoki-yellow-300 "#DFB431") (flexoki-yellow-400 "#D0A215")
    (flexoki-yellow-500 "#BE9207") (flexoki-yellow-600 "#AD8301") (flexoki-yellow-700 "#8E6B01")
    (flexoki-yellow-800 "#664D01") (flexoki-yellow-850 "#503D02") (flexoki-yellow-900 "#3A2D04")
    (flexoki-yellow-950 "#241E08")
    (flexoki-green-50 "#EDEECF") (flexoki-green-100 "#DDE2B2") (flexoki-green-150 "#CDD597")
    (flexoki-green-200 "#BEC97E") (flexoki-green-300 "#A0AF54") (flexoki-green-400 "#879A39")
    (flexoki-green-500 "#768D21") (flexoki-green-600 "#66800B") (flexoki-green-700 "#536907")
    (flexoki-green-800 "#3D4C07") (flexoki-green-850 "#313D07") (flexoki-green-900 "#252D09")
    (flexoki-green-950 "#1A1E0C")
    (flexoki-cyan-50 "#DDF1E4") (flexoki-cyan-100 "#BFE8D9") (flexoki-cyan-150 "#A2DECE")
    (flexoki-cyan-200 "#87D3C3") (flexoki-cyan-300 "#5ABDAC") (flexoki-cyan-400 "#3AA99F")
    (flexoki-cyan-500 "#2F968D") (flexoki-cyan-600 "#24837B") (flexoki-cyan-700 "#1C6C66")
    (flexoki-cyan-800 "#164F4A") (flexoki-cyan-850 "#143F3C") (flexoki-cyan-900 "#122F2C")
    (flexoki-cyan-950 "#101F1D")
    (flexoki-blue-50 "#E1ECEB") (flexoki-blue-100 "#C6DDE8") (flexoki-blue-150 "#ABCFE2")
    (flexoki-blue-200 "#92BFDB") (flexoki-blue-300 "#66A0C8") (flexoki-blue-400 "#4385BE")
    (flexoki-blue-500 "#3171B2") (flexoki-blue-600 "#205EA6") (flexoki-blue-700 "#1A4F8C")
    (flexoki-blue-800 "#163B66") (flexoki-blue-850 "#133051") (flexoki-blue-900 "#12253B")
    (flexoki-blue-950 "#101A24")
    (flexoki-purple-50 "#F0EAEC") (flexoki-purple-100 "#E2D9E9") (flexoki-purple-150 "#D3CAE6")
    (flexoki-purple-200 "#C4B9E0") (flexoki-purple-300 "#A699D0") (flexoki-purple-400 "#8B7EC8")
    (flexoki-purple-500 "#735EB5") (flexoki-purple-600 "#5E409D") (flexoki-purple-700 "#4F3685")
    (flexoki-purple-800 "#3C2A62") (flexoki-purple-850 "#31234E") (flexoki-purple-900 "#261C39")
    (flexoki-purple-950 "#1A1623")
    (flexoki-magenta-50 "#FEE4E5") (flexoki-magenta-100 "#FCCFDA") (flexoki-magenta-150 "#F9B9CF")
    (flexoki-magenta-200 "#F4A4C2") (flexoki-magenta-300 "#E47DA8") (flexoki-magenta-400 "#CE5D97")
    (flexoki-magenta-500 "#B74583") (flexoki-magenta-600 "#A02F6F") (flexoki-magenta-700 "#87285E")
    (flexoki-magenta-800 "#641F46") (flexoki-magenta-850 "#4F1B39") (flexoki-magenta-900 "#39172B")
    (flexoki-magenta-950 "#24131D")
    ;; Light colours
    (flexoki-light-red flexoki-red-600) (flexoki-light-orange flexoki-orange-600) (flexoki-light-yellow flexoki-yellow-600)
    (flexoki-light-green flexoki-green-600) (flexoki-light-cyan flexoki-cyan-600) (flexoki-light-blue flexoki-blue-600)
    (flexoki-light-purple flexoki-purple-600) (flexoki-light-magenta flexoki-magenta-600)
    (flexoki-light-red-2 flexoki-red-400) (flexoki-light-orange-2 flexoki-orange-400) (flexoki-light-yellow-2 flexoki-yellow-400)
    (flexoki-light-green-2 flexoki-green-400) (flexoki-light-cyan-2 flexoki-cyan-400) (flexoki-light-blue-2 flexoki-blue-400)
    (flexoki-light-purple-2 flexoki-purple-400) (flexoki-light-magenta-2 flexoki-magenta-400)
    (flexoki-light-bg flexoki-paper) (flexoki-light-bg-2 flexoki-base-50)
    (flexoki-light-text flexoki-black) (flexoki-light-text-2 flexoki-base-600) (flexoki-light-text-3 flexoki-base-300)
    (flexoki-light-ui flexoki-base-100) (flexoki-light-ui-2 flexoki-base-150) (flexoki-light-ui-3 flexoki-base-200)
    ;; Dark colours
    (flexoki-dark-red flexoki-red-400) (flexoki-dark-orange flexoki-orange-400) (flexoki-dark-yellow flexoki-yellow-400)
    (flexoki-dark-green flexoki-green-400) (flexoki-dark-cyan flexoki-cyan-400) (flexoki-dark-blue flexoki-blue-400)
    (flexoki-dark-purple flexoki-purple-400) (flexoki-dark-magenta flexoki-magenta-400)
    (flexoki-dark-red-2 flexoki-red-600) (flexoki-dark-orange-2 flexoki-orange-600) (flexoki-dark-yellow-2 flexoki-yellow-600)
    (flexoki-dark-green-2 flexoki-green-600) (flexoki-dark-cyan-2 flexoki-cyan-600) (flexoki-dark-blue-2 flexoki-blue-600)
    (flexoki-dark-purple-2 flexoki-purple-600) (flexoki-dark-magenta-2 flexoki-magenta-600)
    (flexoki-dark-bg flexoki-black) (flexoki-dark-bg-2 flexoki-base-950)
    (flexoki-dark-text flexoki-base-200) (flexoki-dark-text-2 flexoki-base-500) (flexoki-dark-text-3 flexoki-base-700)
    (flexoki-dark-ui flexoki-base-900) (flexoki-dark-ui-2 flexoki-base-850) (flexoki-dark-ui-3 flexoki-base-800)

    (fringe unspecified)
    (fg-region unspecified)

    (bg-diff-context bg-dim)

    (bg-tab-bar bg-dim)
    (bg-tab-current bg-main)
    (bg-tab-other bg-active)

    (fg-line-number-inactive fg-dim)
    (fg-line-number-active fg-main)
    (bg-line-number-inactive bg-dim)
    (bg-line-number-active bg-active)

    (bg-mode-line-active bg-active)
    (fg-mode-line-active fg-main)
    (border-mode-line-active border)
    (bg-mode-line-inactive bg-dim)
    (fg-mode-line-inactive fg-dim)
    (border-mode-line-inactive border)

    (bg-prominent-err bg-err)
    (bg-prominent-warning bg-warning)
    (bg-prominent-note bg-info)
    (fg-prominent-err err)
    (fg-prominent-warning warning)
    (fg-prominent-note info)

    (bg-active-argument bg-warning)
    (fg-active-argument warning)
    (bg-active-value bg-info)
    (fg-active-value info)

    (fg-completion-match-0 accent-0)
    (fg-completion-match-1 accent-1)
    (fg-completion-match-2 accent-2)
    (fg-completion-match-3 accent-3)
    (bg-completion-match-0 unspecified)
    (bg-completion-match-1 unspecified)
    (bg-completion-match-2 unspecified)
    (bg-completion-match-3 unspecified)

    (bg-space unspecified)
    (fg-space border)

    (fg-heading-0 rainbow-0)
    (fg-heading-1 rainbow-1)
    (fg-heading-2 rainbow-2)
    (fg-heading-3 rainbow-3)
    (fg-heading-4 rainbow-4)
    (fg-heading-5 rainbow-5)
    (fg-heading-6 rainbow-6)
    (fg-heading-7 rainbow-7)
    (fg-heading-8 rainbow-8)

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
  "Common palette mappings for the Flexoki themes.")

(defconst flexoki-themes-faces
  '(
;;;;; git-gutter-fr
    `(git-gutter-fr:added ((,c :background ,bg-main :foreground ,bg-added-refine)))
    `(git-gutter-fr:deleted ((,c :background ,bg-main :foreground ,bg-removed-refine)))
    `(git-gutter-fr:modified ((,c :background ,bg-main :foreground ,bg-changed-refine)))))

;;;###autoload
(when load-file-name
  (let ((dir (file-name-directory load-file-name)))
    (unless (file-equal-p dir (expand-file-name "themes/" data-directory))
      (add-to-list 'custom-theme-load-path dir))))

(provide 'flexoki-themes)
