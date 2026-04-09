# Media Tracker

Desktop and mobile app for tracking media (anime, manga, books, games, and similar).

## Building

```bash
export MEDIATRACKER_ONEDRIVE_CLIENT_ID='<your-guid>'
npm i
npm run tauri dev # or any of the below
```

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server only |
| `npm run dev:host` | Vite with `--host` |
| `npm run build` | Typecheck + production Vite build |
| `npm run tauri` | Passthrough to `@tauri-apps/cli` |
| `npm run tauri:dev:reuse` | Tauri dev with alternate config (reuse Vite) |
| `npm run android:dev` | Tauri Android dev |
| `npm run android:dev:adb` | Android dev with fixed host for adb |

### Example
```bash
export MEDIATRACKER_ONEDRIVE_CLIENT_ID='<your-guid>'
npm i
npm npm run dev
npm npm run tauri:dev:reuse
npm npm run android:dev:adb
```

The above opens a dev for desktop and mobile (using adb)

## TODO:
- Maybe something with tags from the api
