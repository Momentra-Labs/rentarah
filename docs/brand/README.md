# RentaraH logo

This is the original RentaraH logo, redrawn as clean vector artwork:
- **Icon:** a location pin with a hook, a car and a scooter.
- **Wordmark:** "RentaraH" in rounded letters.

The design is unchanged. The source (`src/assets/rentara.png`) was a fuzzy raster image, so the logo was rebuilt from it:

- **Icon:** every element is a 32-unit rounded stroke placed on geometry fitted to the original. The pin and the hook share one centre, as in the original. The lumpy outline is now a true pin shape, and the hook's tail runs as one continuous curve.
- **Wordmark:** the original letters, traced directly from the old logo artwork. No font is used. The trace removes the source's grain and specks and smooths the edges, but keeps the letterforms and spacing exactly as drawn.

All artwork shares the original 2640 × 660 coordinate space.

## Colours

| Token | Value | Use |
|---|---|---|
| Icon gradient | `#3B82F6` → `#1A56DB` → `#1E40AF` (top-left to bottom-right) | Icon on light backgrounds |
| Icon gradient, dark | `#A5C0FF` → `#6E98FF` → `#4F7BEA` | Icon on dark backgrounds |
| App tile gradient | `#3A7BFA` → `#1A56DB` → `#163FA6` | App icon and favicon backgrounds |
| RentaraH Blue | `#1A56DB` | Flat one-colour uses |
| Ink | `#141821` | Wordmark on light backgrounds |
| Paper | `#F3F5FA` | Wordmark on dark backgrounds |

Use the `-flat` files where gradients can't be reproduced, such as embroidery, single-colour print or vinyl.

## Alignment

In the horizontal logo, the icon is lifted so both wheels rest on the wordmark's baseline: the car and scooter sit on the same line as the letters. The frame is centred on the wordmark, so the name sits dead-centre in a navbar or any other container.

## Which file to use (`svg/`)

| Need | File |
|---|---|
| Web header, documents (light background) | `rentarah-logo.svg` (`rentarah-logo-flat.svg` without gradient) |
| Dark background | `rentarah-logo-dark.svg` |
| On brand blue or a photo | `rentarah-logo-white.svg` |
| Splash screen, square layouts | `rentarah-logo-stacked.svg` (`-white` on blue) |
| Icon alone | `rentarah-icon.svg` (`-white`, `-ink` variants) |
| Wordmark alone | `rentarah-wordmark.svg` (`-white` variant) |
| Rounded app icon | `rentarah-app-icon.svg` (blue tile), `rentarah-app-icon-light.svg` (white tile) |

## App icons (`png/`)

**iOS:** add `ios/AppIcon-1024.png` to `Assets.xcassets/AppIcon` as the single 1024 × 1024 "Any" image. Xcode generates the other sizes. The file is full-bleed with no transparency, as Apple requires; iOS rounds the corners itself.

**Android (adaptive icon):** in Android Studio, use *New → Image Asset → Launcher Icons (Adaptive and Legacy)*:
- Foreground layer: `android/ic_launcher_foreground.png` (art sized to fit inside the 66 dp safe circle)
- Background layer: colour `#1A56DB` (or `android/ic_launcher_background.png`)
- Monochrome layer (Android 13 themed icons): `android/ic_launcher_monochrome.png`
- Google Play listing: `android/play-store-512.png`

**Web / PWA:** these files are already installed in `public/`:
- `favicon.svg`, `favicon-32.png`
- `apple-touch-icon.png`
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`
- `manifest.webmanifest`

**Social:**
- Facebook profile picture: `social/facebook-profile-2048.png` (a 1080 px version is also included; source: `svg/rentarah-facebook-profile.svg`). It shows the icon only, on the brand gradient, sized and optically centred for Facebook's circle crop, and stays legible down to the 40 px comment avatar.
- Other profile pictures (LinkedIn, X, Instagram): `social/avatar-1080.png`. The icon sits inside the circle-crop safe area.
- Logo on white, for posts and partner pages: `social/logo-on-white-1600.png`

## Rules

- **Clear space:** keep space around the logo at least as tall as the scooter's wheel.
- **Minimum size:** full logo 120 px wide; icon 24 px. For 16–32 px favicons, use the app-icon tile, which enlarges the icon within the tile.
- **Don't** recolour parts of the icon separately, stretch or rotate the logo, add effects, or retype the wordmark in a font.

## In the app

`src/components/brand/RentaraLogoMark.tsx` draws the logo inline, so it follows the light and dark theme colours. The wordmark outline lives in `rentarahLogoData.ts`, which is generated from the same trace as the masters. If the masters change, regenerate that file rather than editing it by hand.
