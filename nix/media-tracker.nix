# Installable Linux package: Vite frontend + Tauri Rust binary (no AppImage/deb bundling).
{
  lib,
  rustPlatform,
  fetchNpmDeps,
  npmHooks,
  nodejs,
  pkg-config,
  wrapGAppsHook4,
  atk,
  cairo,
  gdk-pixbuf,
  glib,
  gobject-introspection,
  gtk3,
  openssl,
  pango,
  sqlite,
  libsoup_3,
  webkitgtk_4_1,
  libayatana-appindicator,
  copyDesktopItems,
  makeDesktopItem,
  oneDriveClientId ? "6524f94b-35eb-46c1-84a6-53fd82ae1fa8",
}:

let
  pname = "media-tracker";
  version = (lib.importJSON ../package.json).version;
  src = lib.cleanSourceWith {
    src = ../.;
    filter =
      path: _type:
      let
        b = baseNameOf path;
      in
      b != "node_modules"
      && b != "target"
      && b != "result"
      && b != ".git";
  };
  npmDeps = fetchNpmDeps {
    inherit src;
    hash = "sha256-hywUnNqBie9PciRaQgwbfxmFxO1MsJsuF6t+4gEmWW0=";
  };
  cargoLockFile = ../src-tauri/Cargo.lock;
in

rustPlatform.buildRustPackage {
  inherit pname version src npmDeps;

  strictDeps = true;

  cargoLock.lockFile = cargoLockFile;

  postPatch = ''
    cp ${cargoLockFile} Cargo.lock
  '';

  nativeBuildInputs = [
    nodejs
    npmHooks.npmConfigHook
    pkg-config
    wrapGAppsHook4
    copyDesktopItems
  ];

  buildInputs = [
    gtk3
    webkitgtk_4_1
    libsoup_3
    openssl
    sqlite
    atk
    cairo
    gdk-pixbuf
    glib
    gobject-introspection
    pango
    libayatana-appindicator
  ];

  env = {
    MEDIATRACKER_ONEDRIVE_CLIENT_ID = oneDriveClientId;
    OPENSSL_DIR = "${openssl.dev}";
  };

  PKG_CONFIG_PATH = lib.makeSearchPath "lib/pkgconfig" [
    openssl.dev
    libsoup_3.dev
    webkitgtk_4_1.dev
    gtk3.dev
    glib.dev
    cairo.dev
    pango.dev
    atk.dev
    gdk-pixbuf.dev
    gobject-introspection.dev
  ];

  desktopItems = [
    (makeDesktopItem {
      name = pname;
      desktopName = "Media Tracker";
      comment = "Track anime, manga, books, games, and similar media";
      exec = "${pname} %u";
      icon = pname;
      mimeTypes = [ "x-scheme-handler/media-tracker" ];
      categories = [
        "Utility"
        "Office"
      ];
    })
  ];

  preBuild = ''
    npm ci --offline --no-audit --no-fund
    # node_modules/.bin/* use #!/usr/bin/env (missing in the Nix builder).
    patchShebangs node_modules
    npm run build
    # cargoBuildHook runs in this shell; stay at repo root for npm, then build Rust in src-tauri.
    cd src-tauri
  '';

  postInstall = ''
    mv "$out/bin/tauri-app" "$out/bin/${pname}"
    install -Dm644 "$src/src-tauri/icons/icon.png" "$out/share/pixmaps/${pname}.png"
  '';

  meta = {
    description = "Desktop app for tracking media (Tauri + Vue)";
    homepage = "https://github.com/nixbtw/MediaTracker";
    license = lib.licenses.mit;
    platforms = lib.platforms.linux;
    mainProgram = pname;
  };
}
