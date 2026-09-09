;;; jinlor.el --- Colorful and legible themes -*- lexical-binding: t -*-

;; Copyright (C) 2026 dalu
;; SPDX-License-Identifier: GPL-3.0-or-later
;;
;; Author: dalu <mou.tong@qq.com>
;; Maintainer: dalu <mou.tong@qq.com>
;; URL: https://github.com/dalugm/jinlor.el
;; Version: 0.5.1
;; Package-Requires: ((emacs "30.1") (modus-themes "5.3.0"))
;; Keywords: faces, theme, accessibility

;; This file is NOT part of GNU Emacs.

;; This program is free software: you can redistribute it and/or modify
;; it under the terms of the GNU General Public License as published by
;; the Free Software Foundation, either version 3 of the License, or
;; (at your option) any later version.
;;
;; This program is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; GNU General Public License for more details.
;;
;; You should have received a copy of the GNU General Public License
;; along with this program.  If not, see <https://www.gnu.org/licenses/>.

;;; Commentary:
;;
;; `jinlor' is a collection of colorful, legible themes inspired
;; by architecture, characters, and imagined worlds.  It is built on
;; Modus Themes.

;;; Code:

(require 'modus-themes)
(eval-when-compile (require 'subr-x))

;;;; Basics for building Jinlor themes

(defgroup jinlor ()
  "Colorful and legible themes."
  :group 'faces
  :group 'modus-themes
  :link '(url-link :tag "Website" "https://github.com/dalugm/jinlor.el")
  :prefix "jinlor-"
  :tag "Jinlor Themes")

(defconst jinlor-light-themes
  '(jinlor-eva-00)
  "List of symbols with the light Jinlor themes.")

(defconst jinlor-dark-themes
  '(jinlor-elysia
    jinlor-eva-01
    jinlor-eva-02
    jinlor-palace)
  "List of symbols with the dark Jinlor themes.")

(defconst jinlor-items
  (append jinlor-light-themes jinlor-dark-themes)
  "Symbols of all the Jinlor themes.")

(defconst jinlor-common-palette-mappings
  '((bg-diff-context bg-dim)

    (fg-region unspecified)

    (fringe bg-dim)

    (docmarkup constant)
    (property variable)

    (date-common cyan-warmer)
    (date-deadline red)
    (date-event fg-alt)
    (date-holiday red-cooler)
    (date-now fg-main)
    (date-range fg-alt)
    (date-scheduled red-cooler)
    (date-weekday cyan-warmer)
    (date-weekend red)

    (bg-prompt unspecified)

    (fg-line-number-inactive fg-dim)
    (fg-line-number-active fg-main)
    (bg-line-number-inactive unspecified)
    (bg-line-number-active unspecified)

    (fg-completion-match-0 red-warmer)
    (fg-completion-match-1 cyan)
    (fg-completion-match-2 green-cooler)
    (fg-completion-match-3 magenta-cooler)

    (rainbow-1 blue-cooler)
    (rainbow-2 yellow-cooler)
    (rainbow-3 magenta-cooler)
    (rainbow-4 red-faint)
    (rainbow-5 green-warmer)
    (rainbow-6 cyan-cooler)
    (rainbow-7 blue-faint)
    (rainbow-8 magenta-warmer)

    (bg-tab-bar bg-alt)
    (bg-tab-current bg-main)
    (bg-tab-other bg-active)

    (bg-space unspecified)
    (fg-space border)
    (bg-space-err bg-red-intense)

    (bg-search-current bg-magenta-intense)
    (bg-search-lazy bg-cyan-intense)
    (bg-search-static bg-yellow-subtle)
    (bg-search-replace bg-red-intense)

    (fg-search-current fg-main)
    (fg-search-lazy fg-main)
    (fg-search-static fg-main)
    (fg-search-replace fg-main)

    (bg-search-rx-group-0 bg-blue-intense)
    (bg-search-rx-group-1 bg-yellow-intense)
    (bg-search-rx-group-2 bg-green-subtle)
    (bg-search-rx-group-3 bg-magenta-subtle)

    (fg-search-rx-group-0 fg-main)
    (fg-search-rx-group-1 fg-main)
    (fg-search-rx-group-2 fg-main)
    (fg-search-rx-group-3 fg-main)

    (fg-prose-code cyan-cooler)
    (fg-prose-macro green-warmer)
    (fg-prose-verbatim magenta-warmer)

    (fg-heading-0 rainbow-0)
    (fg-heading-1 rainbow-1)
    (fg-heading-2 rainbow-2)
    (fg-heading-3 rainbow-3)
    (fg-heading-4 rainbow-4)
    (fg-heading-5 rainbow-5)
    (fg-heading-6 rainbow-6)
    (fg-heading-7 rainbow-7)
    (fg-heading-8 rainbow-8))
  "Common palette mappings for the Jinlor themes.")

(defconst jinlor--eva-palette-mappings
  '((cursor eva-secondary-bright)
    (name eva-primary-bright)
    (keybind eva-accent)
    (err red)
    (warning eva-accent)
    (info eva-secondary)
    (identifier eva-neutral)
    (fg-prompt eva-secondary-bright)
    (builtin eva-primary-bright)
    (comment fg-dim)
    (constant eva-primary-bright)
    (fnname eva-pilot)
    (fnname-call blue-warmer)
    (keyword eva-accent)
    (preprocessor eva-primary-bright)
    (docstring eva-secondary)
    (string eva-secondary-bright)
    (type eva-pilot)
    (variable eva-primary-bright)
    (variable-use eva-accent)
    (rx-backslash eva-secondary)
    (rx-construct eva-primary-bright)
    (accent-0 eva-primary-bright)
    (accent-1 eva-secondary-bright)
    (accent-2 eva-accent)
    (accent-3 eva-pilot)
    (fg-link eva-pilot)
    (underline-link eva-pilot)
    (fg-link-visited eva-primary-bright)
    (underline-link-visited eva-primary-bright)
    (mail-cite-0 eva-primary-bright)
    (mail-cite-1 eva-secondary-bright)
    (mail-cite-2 eva-pilot)
    (mail-cite-3 eva-accent)
    (mail-recipient eva-pilot)
    (mail-subject eva-primary-bright)
    (mail-other eva-secondary)
    (prose-verbatim eva-neutral))
  "Palette mappings shared by the Evangelion themes.")

(defun jinlor--generate-eva-palette (base-colors temperature)
  "Generate an Evangelion palette from BASE-COLORS and TEMPERATURE."
  (modus-themes-generate-palette
   base-colors
   temperature
   nil
   (append jinlor--eva-palette-mappings
           jinlor-common-palette-mappings)))

(defconst jinlor-custom-faces
  '(
    `(company-tooltip ((,c :background ,bg-alt)))
    `(corfu-default ((,c :background ,bg-alt)))
    `(magit-section-highlight ((,c :background ,bg-alt)))
    `(magit-diff-file-heading-highlight ((,c :inherit magit-diff-file-heading :background ,bg-alt)))))

(defconst jinlor-with-properties
  '((jinlor-eva-00
     jinlor "Evangelion Unit-00 and Rei Ayanami." light
     modus-themes-operandi-palette
     jinlor-eva-00-palette jinlor-eva-00-palette-overrides)
    (jinlor-eva-01
     jinlor "Evangelion Unit-01 and Shinji Ikari." dark
     modus-themes-vivendi-palette
     jinlor-eva-01-palette jinlor-eva-01-palette-overrides)
    (jinlor-eva-02
     jinlor "Evangelion Unit-02 and Asuka Shikinami Langley." dark
     modus-themes-vivendi-palette
     jinlor-eva-02-palette jinlor-eva-02-palette-overrides)
    (jinlor-palace
     jinlor "The Palace Museum." dark
     modus-themes-vivendi-palette
     jinlor-palace-palette jinlor-palace-palette-overrides)
    (jinlor-elysia
     jinlor "To Romantic Unfailing Elysia." dark
     modus-themes-vivendi-palette
     jinlor-elysia-palette jinlor-elysia-palette-overrides)))

(defvar jinlor--declared nil)

(defun jinlor-declare-themes ()
  "Declare the Jinlor themes."
  (unless jinlor--declared
    (dolist (theme jinlor-with-properties)
      (apply #'modus-themes-declare theme)
      (modus-themes-register (car theme)))
    (setq jinlor--declared t)))

(jinlor-declare-themes)

;;;; Limit the Modus themes to only Jinlor themes

;;;###autoload
(define-minor-mode jinlor-take-over-modus-themes-mode
  "When enabled, all Modus themes commands consider only Jinlor themes.
Alternatively, use the commands `jinlor-rotate',
`jinlor-select', `jinlor-load-random',
`jinlor-load-random-dark', `jinlor-load-random-light',
`jinlor-list-colors', `jinlor-list-colors-current'.
They are all designed to only consider Jinlor themes."
  :global t
  :init-value nil)

(cl-defmethod modus-themes-get-themes (&context (jinlor-take-over-modus-themes-mode (eql t)))
  "Return Jinlor themes when takeover mode is active.
This applies when JINLOR-TAKE-OVER-MODUS-THEMES-MODE is non-nil."
  (if-let* ((themes (modus-themes-get-all-known-themes 'jinlor))
            (sorted-a-z (sort themes #'string-lessp))
            (sorted-light-dark (modus-themes-sort sorted-a-z 'light)))
      sorted-light-dark
    jinlor-items))

;;;; Convenience commands

;;;###autoload (autoload 'jinlor-toggle "jinlor" nil t)
(modus-themes-define-derivative-command jinlor toggle)

;;;###autoload (autoload 'jinlor-rotate "jinlor" nil t)
(modus-themes-define-derivative-command jinlor rotate)

;;;###autoload (autoload 'jinlor-select "jinlor" nil t)
(modus-themes-define-derivative-command jinlor select)

;;;###autoload (autoload 'jinlor-load-random "jinlor" nil t)
(modus-themes-define-derivative-command jinlor load-random)

;;;###autoload (autoload 'jinlor-load-random-dark "jinlor" nil t)
(modus-themes-define-derivative-command jinlor load-random-dark)

;;;###autoload (autoload 'jinlor-load-random-light "jinlor" nil t)
(modus-themes-define-derivative-command jinlor load-random-light)

;;;###autoload (autoload 'jinlor-list-colors "jinlor" nil t)
(modus-themes-define-derivative-command jinlor list-colors)

;;;###autoload (autoload 'jinlor-list-colors-current "jinlor" nil t)
(modus-themes-define-derivative-command jinlor list-colors-current)

;;;; Add themes from the package to the load path

;;;###autoload
(when load-file-name
  (let ((dir (file-name-directory load-file-name)))
    (unless (file-equal-p dir (expand-file-name "themes/" data-directory))
      (add-to-list 'custom-theme-load-path dir))))

(provide 'jinlor)
;;; jinlor.el ends here
