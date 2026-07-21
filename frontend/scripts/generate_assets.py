#!/usr/bin/env python3
"""Generate HD app icon and splash screen assets for all platforms."""

import math, os, sys
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')
ANDROID_RES = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')
IOS_DIR = os.path.join(os.path.dirname(__file__), '..', 'ios', 'App', 'App', 'Assets.xcassets')
BLUE = (1, 73, 175)
NEAR_BLACK = (9, 9, 11)
WHITE = (255, 255, 255)

def make_blood_drop(size, padding=0.18):
    """Draw a blood drop icon on transparent background."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    p = int(size * padding)
    inner_size = size - 2 * p
    cx, cy = size // 2, size // 2 + int(size * 0.05)
    r = inner_size // 2

    # Blood drop shape: circle bottom + triangle top
    # Circle center at (cx, cy + offset) with radius r
    drop_bottom = cy + int(r * 0.3)
    circle_cy = drop_bottom - int(r * 0.5)
    circle_r = int(r * 0.65)

    # Draw a smooth blood drop shape using ellipse + polygon
    # The drop: wider rounded bottom that tapers to a point at top

    # Use a multi-point polygon for smooth curve
    points = []
    steps = 60
    for i in range(steps):
        angle = math.pi * 2 * i / steps - math.pi / 2
        # Parametric blood drop: circle at bottom tapers to point at top
        t = (angle + math.pi / 2) / (2 * math.pi)  # 0 to 1
        # Shape: circular at bottom (t ~ 0.75-0.25), pinched at top (t ~ 0.5)
        if angle < -math.pi / 2:
            angle_norm = angle + math.pi / 2  # 0 to pi/2 going up
            taper = 1 - (angle_norm / (math.pi / 2)) * 0.5
        elif angle > math.pi / 2:
            angle_norm = angle - math.pi / 2  # 0 to pi/2 going down
            taper = 1 - ((math.pi / 2 - angle_norm) / (math.pi / 2)) * 0.5
        else:
            taper = 1 - abs(math.cos(angle)) * 0.55

        drop_r = circle_r * taper
        # Pull top point upward
        if abs(angle) < math.pi * 0.15:
            stretch = 1 + (1 - abs(angle) / (math.pi * 0.15)) * 0.6
        else:
            stretch = 1

        px = cx + drop_r * math.cos(angle)
        py = circle_cy + drop_r * math.sin(angle) * stretch
        points.append((px, py))

    draw.polygon(points, fill=WHITE)

    # Add a small highlight for depth
    hl_cy = circle_cy - int(circle_r * 0.35)
    hl_r = int(circle_r * 0.18)
    draw.ellipse(
        [cx - hl_r, hl_cy - hl_r, cx + hl_r, hl_cy + hl_r],
        fill=(255, 255, 255, 80)
    )

    return img


def make_icon_foreground(size):
    """App icon foreground: blood drop on transparent."""
    return make_blood_drop(size)


def make_icon_background(size):
    """App icon background: solid blue."""
    img = Image.new('RGB', (size, size), BLUE)
    return img


def make_icon(size):
    """Combined icon: blood drop centered on blue background."""
    bg = Image.new('RGB', (size, size), BLUE)
    fg = make_blood_drop(size)
    bg.paste(fg, (0, 0), fg)
    return bg


def make_splash(size, dark=False):
    """Splash screen with app name centered."""
    bg_color = NEAR_BLACK if dark else BLUE
    text_color = WHITE
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    # Try to find a font
    font_paths = [
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/Helvetica.ttf',
        '/System/Library/Fonts/SFNSDisplay.ttf',
        '/System/Library/Fonts/HelveticaNeue.ttc',
    ]
    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, size // 12)
                break
            except Exception:
                continue

    # Draw a small blood drop icon above text
    icon_size = size // 5
    drop = make_blood_drop(icon_size)
    icon_x = (size - icon_size) // 2
    icon_y = size // 2 - icon_size // 2 - size // 15
    img.paste(drop, (icon_x, icon_y), drop)

    # Draw text
    text = 'Sugar Tracker'
    if font:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (size - tw) // 2
        ty = size // 2 + size // 20
        draw.text((tx, ty), text, font=font, fill=text_color)
    else:
        print("Warning: no font found, skipping text on splash")

    return img


def resize_to(src_size, dst_size, src_img):
    """Resize image with high quality."""
    if src_size == dst_size:
        return src_img
    return src_img.resize((dst_size, dst_size), Image.Resampling.LANCZOS)


def save_android_mipmap(name, img, base_size):
    """Save image at all Android mipmap densities."""
    densities = {
        'mipmap-ldpi': 0.75,
        'mipmap-mdpi': 1.0,
        'mipmap-hdpi': 1.5,
        'mipmap-xhdpi': 2.0,
        'mipmap-xxhdpi': 3.0,
        'mipmap-xxxhdpi': 4.0,
    }
    mdpi_size = base_size  # size at mdpi scaling
    for folder, scale in densities.items():
        dst_size = int(mdpi_size * scale)
        if dst_size < 1:
            continue
        resized = resize_to(img.width, dst_size, img)
        path = os.path.join(ANDROID_RES, folder, f'{name}.png')
        resized.save(path, 'PNG')
        print(f'  {path} ({dst_size}x{dst_size})')


def main():
    print("=== Generating HD App Assets ===")
    os.makedirs(ASSETS_DIR, exist_ok=True)

    # --- Source Assets ---
    print("\n1. Creating HD source icons (2048x2048)...")
    src_size = 2048

    # Icon foreground (blood drop on transparent)
    fg = make_icon_foreground(src_size)
    fg.save(os.path.join(ASSETS_DIR, 'icon-foreground.png'), 'PNG')
    print(f"  icon-foreground.png ({src_size}x{src_size})")

    # Icon background (solid blue)
    bg = make_icon_background(src_size)
    bg.save(os.path.join(ASSETS_DIR, 'icon-background.png'), 'PNG')
    print(f"  icon-background.png ({src_size}x{src_size})")

    # Combined icon
    icon = make_icon(src_size)
    icon.save(os.path.join(ASSETS_DIR, 'icon-only.png'), 'PNG')
    print(f"  icon-only.png ({src_size}x{src_size})")

    # Splash screens
    splash_size = 4096
    print(f"\n2. Creating HD splash screens ({splash_size}x{splash_size})...")
    splash = make_splash(splash_size, dark=False)
    splash.save(os.path.join(ASSETS_DIR, 'splash.png'), 'PNG')
    print(f"  splash.png ({splash_size}x{splash_size})")

    splash_dark = make_splash(splash_size, dark=True)
    splash_dark.save(os.path.join(ASSETS_DIR, 'splash-dark.png'), 'PNG')
    print(f"  splash-dark.png ({splash_size}x{splash_size})")

    # --- Android Assets ---
    print("\n3. Generating Android mipmap icons...")
    # Android app icon (combined) at 48dp base
    save_android_mipmap('ic_launcher', icon, 48)
    save_android_mipmap('ic_launcher_round', icon, 48)
    save_android_mipmap('ic_launcher_background', bg, 48)
    save_android_mipmap('ic_launcher_foreground', fg, 48)

    # Android splash drawable
    print("\n4. Generating Android splash drawables...")
    android_splash = make_splash(1024, dark=False)
    android_splash.save(os.path.join(ANDROID_RES, 'drawable', 'splash.png'), 'PNG')
    print(f"  drawable/splash.png (1024x1024)")
    android_splash.save(os.path.join(ANDROID_RES, 'drawable-v24', 'splash.png'), 'PNG')
    print(f"  drawable-v24/splash.png (1024x1024)")

    # --- iOS Assets ---
    print("\n5. Generating iOS AppIcon...")
    appicon_dir = os.path.join(IOS_DIR, 'AppIcon.appiconset')
    os.makedirs(appicon_dir, exist_ok=True)
    # iOS expects 1024x1024 for universal icon
    ios_icon = resize_to(icon.width, 1024, icon)
    ios_icon.save(os.path.join(appicon_dir, 'AppIcon-512@2x.png'), 'PNG')
    print(f"  AppIcon-512@2x.png (1024x1024)")

    print("\n6. Generating iOS Splash screens...")
    splash_dir = os.path.join(IOS_DIR, 'Splash.imageset')
    os.makedirs(splash_dir, exist_ok=True)
    # iOS splash at 2732x2732 (iPad Pro)
    for suffix, img in [('-2.png', splash), ('-1.png', splash), ('.png', splash)]:
        path = os.path.join(splash_dir, f'splash-2732x2732{suffix}')
        img.save(path, 'PNG')
        print(f"  splash-2732x2732{suffix} (2732x2732)")

    # Dark mode splash
    for suffix, img in [('', splash_dark)]:
        for scale_suffix in ['@1x', '@2x', '@3x']:
            path = os.path.join(splash_dir, f'Default{scale_suffix}~universal~anyany-dark.png')
            img.save(path, 'PNG')
            print(f"  Default{scale_suffix}~universal~anyany-dark.png (2732x2732)")

    print("\n=== All assets generated successfully ===")


if __name__ == '__main__':
    main()
