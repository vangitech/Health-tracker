#!/bin/bash
set -euo pipefail

SRC="/Users/vangitech/Projects/Sugarcare/frontend/assets"
ANDROID="/Users/vangitech/Projects/Sugarcare/frontend/android/app/src/main/res"
IOS="/Users/vangitech/Projects/Sugarcare/frontend/ios/App/App/Assets.xcassets"

echo "=== Generating native platform assets ==="

# ── Android App Icons (mipmap) ───────────────────────────────────────────
echo "--- Android: App Icons ---"

DENSITIES=(
  "ldpi:36"
  "mdpi:48"
  "hdpi:72"
  "xhdpi:96"
  "xxhdpi:144"
  "xxxhdpi:192"
)

for entry in "${DENSITIES[@]}"; do
  density="${entry%%:*}"
  size="${entry##*:}"

  dir="$ANDROID/mipmap-$density"

  sips -z "$size" "$size" "$SRC/icon-foreground.png" \
    --out "$dir/ic_launcher_foreground.png" &>/dev/null
  sips -z "$size" "$size" "$SRC/icon-background.png" \
    --out "$dir/ic_launcher_background.png" &>/dev/null
  sips -z "$size" "$size" "$SRC/icon-only.png" \
    --out "$dir/ic_launcher.png" &>/dev/null
  sips -z "$size" "$size" "$SRC/icon-only.png" \
    --out "$dir/ic_launcher_round.png" &>/dev/null

  echo "  mipmap-$density (${size}x${size}) ✓"
done

# ── Update Android adaptive icon XML to use mipmap background ────────────
echo "--- Android: Adaptive Icon XML ---"

ADAPTIVE_XML='<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>'

echo "$ADAPTIVE_XML" > "$ANDROID/mipmap-anydpi-v26/ic_launcher.xml"
echo "$ADAPTIVE_XML" > "$ANDROID/mipmap-anydpi-v26/ic_launcher_round.xml"
echo "  adaptive-icon XML updated ✓"

# ── Android Splash Screens ────────────────────────────────────────────────
echo "--- Android: Splash Screens ---"

# base drawable (no qualifier)
sips -z 320 240 "$SRC/splash.png" --out "$ANDROID/drawable/splash.png" &>/dev/null
sips -z 320 240 "$SRC/splash-dark.png" --out "$ANDROID/drawable-night/splash.png" &>/dev/null
echo "  drawable (320x240) ✓"
echo "  drawable-night (320x240) ✓"

# Portrait variants
PORT_SIZES=(
  "port-ldpi:240:320"
  "port-mdpi:320:480"
  "port-hdpi:480:800"
  "port-xhdpi:720:1280"
  "port-xxhdpi:960:1600"
  "port-xxxhdpi:1280:1920"
)

for entry in "${PORT_SIZES[@]}"; do
  qualifier="${entry%%:*}"
  remaining="${entry#*:}"
  w="${remaining%%:*}"
  h="${remaining##*:}"

  # light
  tdir="$ANDROID/drawable-$qualifier"
  mkdir -p "$tdir"
  sips -z "$h" "$w" "$SRC/splash.png" --out "$tdir/splash.png" &>/dev/null

  # dark
  tdir="$ANDROID/drawable-$qualifier-night"
  mkdir -p "$tdir"
  sips -z "$h" "$w" "$SRC/splash-dark.png" --out "$tdir/splash.png" &>/dev/null

  echo "  drawable-$qualifier (${w}x${h}) ✓"
done

# Landscape variants
LAND_SIZES=(
  "land-ldpi:320:240"
  "land-mdpi:480:320"
  "land-hdpi:800:480"
  "land-xhdpi:1280:720"
  "land-xxhdpi:1600:960"
  "land-xxxhdpi:1920:1280"
)

for entry in "${LAND_SIZES[@]}"; do
  qualifier="${entry%%:*}"
  remaining="${entry#*:}"
  w="${remaining%%:*}"
  h="${remaining##*:}"

  # light
  tdir="$ANDROID/drawable-$qualifier"
  mkdir -p "$tdir"
  sips -z "$h" "$w" "$SRC/splash.png" --out "$tdir/splash.png" &>/dev/null

  # dark
  tdir="$ANDROID/drawable-$qualifier-night"
  mkdir -p "$tdir"
  sips -z "$h" "$w" "$SRC/splash-dark.png" --out "$tdir/splash.png" &>/dev/null

  echo "  drawable-$qualifier (${w}x${h}) ✓"
done

# ── iOS App Icon ─────────────────────────────────────────────────────────
echo "--- iOS: App Icon ---"
sips -z 1024 1024 "$SRC/icon-only.png" \
  --out "$IOS/AppIcon.appiconset/AppIcon-512@2x.png" &>/dev/null
echo "  AppIcon (1024x1024) ✓"

# ── iOS Splash Images ────────────────────────────────────────────────────
echo "--- iOS: Splash Images ---"

# All iOS splash images are 2732x2732
for f in "$IOS/Splash.imageset"/*.png; do
  sips -z 2732 2732 "$SRC/splash.png" --out "$f" &>/dev/null
done

# Dark mode variant: replace Default-*dark.png with splash-dark
sips -z 2732 2732 "$SRC/splash-dark.png" \
  --out "$IOS/Splash.imageset/Default@1x~universal~anyany-dark.png" &>/dev/null
sips -z 2732 2732 "$SRC/splash-dark.png" \
  --out "$IOS/Splash.imageset/Default@2x~universal~anyany-dark.png" &>/dev/null
sips -z 2732 2732 "$SRC/splash-dark.png" \
  --out "$IOS/Splash.imageset/Default@3x~universal~anyany-dark.png" &>/dev/null

echo "  Splash images (2732x2732) ✓"

echo ""
echo "=== All native assets generated successfully ==="
