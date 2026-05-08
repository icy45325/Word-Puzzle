# Assets

Drop these files in this directory:

- `icon.png` — 1024×1024 app icon (the WordScapes logo). Used as both the
  iOS / Android launcher icon and the in-app `<AppLogo>` component on the
  Home screen.
- `adaptive-icon.png` (optional) — Android adaptive foreground 1024×1024
  with the logo design centered in the inner ~640×640 safe zone. If you
  skip it, Android falls back to `icon.png`.
- `splash.png` (optional) — 1242×2436 splash image. If skipped, the splash
  is just the background color from `app.json`.

After dropping `icon.png`, run:

```bash
eas build -p android --profile preview
```

The icon is bundled at build time.
