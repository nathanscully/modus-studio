# Real-Emacs theme screenshots, hermetically: export every themes/**/*.json to
# a .el with the dependency-free node exporter, then render each in a cairo
# X11 Emacs under Xvfb via x-export-frames (Linux only; on the Mac this builds
# on the linux-builder and the PNGs land in ./result).
{
  pkgs,
  src,
  themeCache,
}:

let
  # typescript-ts-mode (built into Emacs) needs the treesit grammar .so;
  # the wrapper's site-start wiring is skipped under -Q, so the driver reads
  # this path into treesit-extra-load-path explicitly.
  tsGrammars = pkgs.emacs.pkgs.treesit-grammars.with-all-grammars;
in
pkgs.stdenvNoCC.mkDerivation {
  name = "theme-screenshots";
  inherit src;

  nativeBuildInputs = [
    pkgs.nodejs_24
    pkgs.xorg.xorgserver
    pkgs.emacs
  ];

  env.TREESIT_GRAMMAR_DIR = "${tsGrammars}/lib";

  env.FONTCONFIG_FILE = pkgs.makeFontsConf {
    fontDirectories = [ (pkgs.ibm-plex.override { families = [ "mono" ]; }) ];
  };

  buildPhase = ''
    export HOME=$TMPDIR
    export XDG_CACHE_HOME=$TMPDIR/cache

    mkdir -p themes/.cache
    cp -r ${themeCache}/. themes/.cache/
    chmod -R u+w themes
    node scripts/resolve-themes.ts --offline
    node screenshots/export-themes.ts themes "$TMPDIR/el"

    # Staged project directory for the dired window: real repo files with a
    # pinned mtime so listings are deterministic and free of sandbox noise.
    staged=$TMPDIR/modus-studio
    mkdir -p "$staged"/{src,themes,screenshots,docs,public}
    cp README.md LICENSE CONTRIBUTING.md flake.nix "$staged/"
    cp "$TMPDIR/el/sample.ts" "$staged/src/"
    cp screenshots/sample.org "$staged/src/"
    find "$staged" -exec touch -t 202607161200 {} +

    # One Xvfb for the whole run: 24-bit (the 8-bit default quantizes theme
    # colors), 2x-sized screen for retina-crisp text, -ac because clients have
    # no xauth cookie in the sandbox, -noreset so the server survives clients
    # disconnecting between sequential renders.
    Xvfb :99 -screen 0 3400x2700x24 -ac -noreset -nolisten tcp &
    xvfb_pid=$!
    for _ in $(seq 1 100); do
      [ -S /tmp/.X11-unix/X99 ] && break
      sleep 0.1
    done
    [ -S /tmp/.X11-unix/X99 ] || { echo "Xvfb did not come up"; exit 1; }
    export DISPLAY=:99

    mkdir -p $out
    for f in "$TMPDIR"/el/*-theme.el; do
      id=$(basename "$f" -theme.el)
      echo "rendering $id"
      THEME_ID="$id" THEME_DIR="$TMPDIR/el" \
      SAMPLE_TS="$staged/src/sample.ts" SAMPLE_ORG="$staged/src/sample.org" \
      DIRED_DIR="$staged" OUT="$out/$id.png" \
        emacs -Q -l screenshots/driver.el
    done

    kill $xvfb_pid
  '';

  dontInstall = true;
  dontFixup = true;
}
