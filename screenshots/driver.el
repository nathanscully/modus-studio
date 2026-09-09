;;; driver.el --- render one theme to PNG via x-export-frames  -*- lexical-binding: t; -*-

;; Runs inside Xvfb (cairo X build of Emacs; see nix/screenshots.nix):
;;   THEME_ID=<id> THEME_DIR=<dir with <id>-theme.el> SAMPLE_TS=<sample.ts> \
;;   DIRED_DIR=<staged project dir> OUT=<out.png> emacs -Q -l driver.el
;;
;; Composition: a TypeScript buffer (typescript-ts-mode, line numbers) over a
;; dired window of the staged project — the classic two-window theme showcase.
;; Rendered at 2x (28pt on a large Xvfb screen) so the PNG is retina-crisp.
;;
;; x-export-frames RETURNS the PNG bytes (it does not write a file), so the
;; output buffer must be unibyte or coding conversion corrupts the image.
;; In GUI Emacs `message' goes to the echo area, not the terminal — all
;; diagnostics here go to stderr explicitly so the nix build log shows them.

(defun driver-log (fmt &rest args)
  (princ (concat (apply #'format fmt args) "\n") #'external-debugging-output))

(defun driver-die (fmt &rest args)
  (apply #'driver-log (concat "driver.el FAIL: " fmt) args)
  (kill-emacs 1))

(setq inhibit-startup-screen t)
(menu-bar-mode -1)
(tool-bar-mode -1)
(scroll-bar-mode -1)
(blink-cursor-mode -1)
(setq-default cursor-type nil)
(fringe-mode 8)

(condition-case err
    (set-face-attribute 'default nil :family "IBM Plex Mono" :height 280)
  (error (driver-die "set-face-attribute: %S" err)))

;; Fail loudly if fontconfig didn't resolve the pinned font — a silent fallback
;; to the X fixed font would produce wrong-but-plausible screenshots.
(let ((font (or (face-font 'default) "")))
  (unless (string-match-p "IBM Plex\\|IBMPlex" font)
    (driver-die "IBM Plex Mono not found (face-font: %s)" font)))

(unless (fboundp 'x-export-frames)
  (driver-die "x-export-frames not available (non-cairo build?)"))

(let ((grammar-dir (getenv "TREESIT_GRAMMAR_DIR")))
  (when grammar-dir
    (add-to-list 'treesit-extra-load-path grammar-dir)))
(unless (treesit-language-available-p 'typescript)
  (driver-die "typescript treesit grammar not available"))

(set-frame-size (selected-frame) 124 45)

;; Hide owner/group in dired so sandbox build users never leak into the shot,
;; and drop the free-space line (it varies per builder).
(setq dired-listing-switches "-Agho --group-directories-first")
(setq dired-free-space nil)

(let ((id (getenv "THEME_ID")))
  ;; Exported themes (require 'modus-themes); the bundled copy lives in Emacs's
  ;; etc/themes, which is on custom-theme-load-path but not load-path.
  (add-to-list 'load-path (expand-file-name "themes/" data-directory))
  (add-to-list 'custom-theme-load-path (getenv "THEME_DIR"))
  (condition-case err
      (load-theme (intern id) t)
    (error (driver-die "load-theme %s: %S" id err)))

  (find-file (getenv "SAMPLE_TS"))
  (condition-case err
      (typescript-ts-mode)
    (error (driver-die "typescript-ts-mode: %S" err)))
  (font-lock-ensure)
  (display-line-numbers-mode 1)
  (goto-char (point-min))

  ;; Right column: org prose, full height (headings, checkboxes, timestamps,
  ;; todo labels, tags, priorities, a src block).
  (let ((right (split-window (selected-window) -54 t)))
    (set-window-buffer right (find-file-noselect (getenv "SAMPLE_ORG")))
    (with-current-buffer (window-buffer right)
      (font-lock-ensure)))

  ;; Bottom-left: dired. It always expands the directory in its header, so the
  ;; sandbox build path would show; rewrite it to a plausible home-dir path.
  (let ((bottom (split-window (selected-window) -12)))
    (set-window-buffer bottom (dired-noselect (getenv "DIRED_DIR")))
    (with-current-buffer (window-buffer bottom)
      (let ((inhibit-read-only t))
        (save-excursion
          (goto-char (point-min))
          (when (search-forward (getenv "DIRED_DIR") nil t)
            (replace-match "~/modus-studio" t t)))
        (set-buffer-modified-p nil))))

  ;; startup.el has already painted its echo-area message by the time -l files
  ;; run; clear it so the export shows an empty echo area.
  (message nil)
  (redisplay t)
  (sit-for 0.2)
  (condition-case err
      (let ((png (x-export-frames nil 'png)))
        (with-temp-file (getenv "OUT")
          (set-buffer-multibyte nil)
          (insert png)))
    (error (driver-die "x-export-frames %s: %S" id err)))
  (driver-log "driver.el OK: %s" id))

(kill-emacs 0)
