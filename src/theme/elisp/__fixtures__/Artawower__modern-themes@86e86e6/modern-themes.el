;;; modern-themes.el --- Colorful and legible themes -*- lexical-binding:t -*-

;; Copyright (C) 2025  Free Software Foundation, Inc.

;; Author: artawower33@gmail.com
;; Maintainer: artawower
;; URL: https://github.com/artawower/modern-themes
;; Version: 1.0.1
;; Package-Requires: ((emacs "28.1") (modus-themes "5.0.0"))
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
;; The `modern-themes' are a collection of light and dark themes for GNU
;; Emacs.  They are built on top of the `modus-themes' structure,
;; providing colorful and legible options.
;;
;; Available themes:
;; - `modern-deep-atom' (dark): Deep Atom theme port
;; - `modern-pinkywinky` (light): Legible light theme inspired by Pinky Winky
;; - `modern-pinkywinky-dark' (dark): Legible dark theme inspired by Pinky Winky
;; - `modern-zaiste` (light): Modern Zaiste theme port
;; - `modern-nano-light` (light): Modern Nano Light theme port
;; - `modern-nano-dark` (dark): Modern Nano Dark theme port
;; - `modern-tokyo` (dark): Modern Tokyo theme port
;; - `modern-catppuccin-latte` (light): Catppuccin Latte theme port
;; - `modern-catppuccin-frappe` (dark): Catppuccin Frappe theme port
;; - `modern-catppuccin-macchiato` (dark): Catppuccin Macchiato theme port
;; - `modern-catppuccin-mocha` (dark): Catppuccin Mocha theme port
;; - `modern-github-light` (light): GitHub Light theme port
;; - `modern-github-dark` (dark): GitHub Dark theme port
;; - `modern-nightfly-purple (dark): Nightfly Purple theme port'
;; - `modern-helix (dark): Helix theme port'
;; - `modern-liac-dark (dark): Liac Dark theme port'
;;
;; Usage:
;;   (require 'modern-themes)
;;   (load-theme 'modern-deep-atom t)

;;; Code:

(require 'modus-themes)
(require 'seq)

;;;; Customization group

(defgroup modern-themes ()
  "Colorful and legible themes.
The `modern-themes' are built on top of the `modus-themes'."
  :group 'faces
  :group 'modus-themes
  :link '(url-link :tag "Homepage" "https://github.com/artawower/modern-themes")
  :prefix "modern-themes-"
  :tag "Modern Themes")

;;;; Theme lists

(defconst modern-themes-light-themes
  '(modern-pinkywinky
    modern-zaiste
    modern-nano-light
    modern-catppuccin-latte
    modern-ayu-light
    modern-github-light
    modern-quiet-light
    modern-spacegray-light)
  "List of symbols with the light Modern themes.")

(defconst modern-themes-dark-themes
  '(modern-deep-atom
    modern-nano-dark
    modern-nano-dark-2
    modern-pinkywinky-dark
    modern-tokyo
    modern-catppuccin-frappe
    modern-catppuccin-macchiato
    modern-catppuccin-mocha
    modern-liac-dark
    modern-github-dark
    modern-nightfly-purple
    modern-ayu-dark
    modern-ayu-mirage
    modern-helix
    modern-fluoromachine-high-contrast
    modern-gruvbox-material
    modern-laser
    modern-spacegray)
  "List of symbols with the dark Modern themes.")

(defconst modern-themes-items
  (append modern-themes-light-themes modern-themes-dark-themes)
  "Symbols of all the Modern themes.")

;;;; Add themes from package to path

;;;###autoload
(when load-file-name
  (let ((dir (file-name-directory load-file-name)))
    (unless (file-equal-p dir (expand-file-name "themes/" data-directory))
      (add-to-list 'custom-theme-load-path dir))))

(defun modern-themes--load-random-from (list)
  "Helper: pick and load a random theme from LIST.
Ensures the selected theme is not currently active."
  (let* ((active-themes custom-enabled-themes)
         ;; Filter out any theme that is currently active (enabled)
         (candidates (seq-remove (lambda (theme) (memq theme active-themes)) list))
         ;; If all themes are active (unlikely), fallback to the full list to avoid errors
         (final-list (if candidates candidates list))
         (theme (nth (random (length final-list)) final-list)))
    (mapc #'disable-theme custom-enabled-themes)
    (load-theme theme t)
    (message "Modern Themes: loaded random theme `%s`" theme)
    theme))

;;;###autoload
(defun modern-themes-random ()
  "Load a random Modern theme (light or dark)."
  (interactive)
  (modern-themes--load-random-from modern-themes-items))

;;;###autoload
(defun modern-themes-random-dark ()
  "Load a random dark Modern theme."
  (interactive)
  (modern-themes--load-random-from modern-themes-dark-themes))

;;;###autoload
(defun modern-themes-random-light ()
  "Load a random light Modern theme."
  (interactive)
  (modern-themes--load-random-from modern-themes-light-themes))

(provide 'modern-themes)
;;; modern-themes.el ends here
