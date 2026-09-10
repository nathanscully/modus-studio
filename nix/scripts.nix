# The shell bodies behind the devshell commands and `nix flake check`, written
# once so the two cannot drift apart. Every script runs from the repo root.
{
  pkgs,
  emacs31,
  emacs30,
}:

rec {
  # The pinned modus-themes 5 the resolver is verified against. On Emacs 30
  # this stands in for the GNU ELPA package: the bundled modus-themes 4 has no
  # `modus-themes-generate-palette`, which author-style exports call.
  modusThemesDir = "src/theme/elisp/__fixtures__/protesilaos__modus-themes@f1ad6c9";

  resolve = ''
    node scripts/resolve-themes.ts "$@"
  '';

  pin = ''
    node scripts/pin-theme.ts "$@"
  '';

  # Export every resolved theme to a .el, then load each one in a clean batch
  # Emacs. `loadPath` (optional) is prepended so a newer modus-themes wins
  # over the bundled copy.
  checkEl =
    {
      emacs,
      out,
      loadPath ? null,
    }:
    let
      pre = if loadPath == null then "" else "(add-to-list 'load-path \\\"${loadPath}\\\")";
    in
    ''
      dir=${out}
      rm -rf "$dir"; mkdir -p "$dir"
      node screenshots/export-themes.ts themes "$dir" >/dev/null
      ${emacs}/bin/emacs --batch -Q --eval "(progn ${pre} (unless (require 'modus-themes nil t) (require-theme 'modus-themes)) (princ (format \"emacs %s, modus-themes-theme is a %s\n\" emacs-version (if (macrop 'modus-themes-theme) \"macro (modus-themes 4)\" \"function (modus-themes 5)\"))))" 2>&1 | tail -1
      fail=0; n=0
      for f in "$dir"/*-theme.el; do
        id=$(basename "$f" -theme.el); n=$((n+1))
        result=$(${emacs}/bin/emacs --batch -Q --eval "(progn ${pre} (add-to-list 'custom-theme-load-path \"$dir\") (load-theme '$id t) (message \"OK %s\" '$id))" 2>&1 | tail -1)
        case "$result" in OK*) ;; *) fail=$((fail+1)); echo "FAIL $id: $result";; esac
      done
      echo "loaded $((n-fail)) of $n themes on ${emacs.name}; fails=$fail"
      [ "$fail" -eq 0 ]
    '';

  checkEl31 = checkEl {
    emacs = emacs31;
    out = "\${TMPDIR:-/tmp}/modus-studio-el31";
  };

  checkEl30 = checkEl {
    emacs = emacs30;
    out = "\${TMPDIR:-/tmp}/modus-studio-el30";
    loadPath = "$PWD/${modusThemesDir}";
  };
}
