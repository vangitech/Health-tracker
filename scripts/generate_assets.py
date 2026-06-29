"""Generate crisp splash and icon assets for Capacitor mobile apps."""
import struct, zlib, os

def solid_png(w, h, r, g, b):
    """Minimal solid-color PNG (very fast due to compression)."""
    raw_row = b'\x00' + struct.pack('BBB', r, g, b) * w
    raw = raw_row * h
    def chtag(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' +
            chtag(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) +
            chtag(b'IDAT', zlib.compress(raw, level=1)) +
            chtag(b'IEND', b''))

# Colors
BG    = (26, 26, 46)   # dark navy
TEAL  = (16, 185, 129) # teal/green
SPLASH_BG = (31, 31, 47) # splash background

# ── Android mipmap icons ──
print("Android mipmap icons...")
for folder, size in [('mipmap-mdpi',48),('mipmap-hdpi',72),('mipmap-xhdpi',96),
                     ('mipmap-xxhdpi',144),('mipmap-xxxhdpi',192)]:
    p = f'/Users/vangitech/Projects/Sugarcare/frontend/android/app/src/main/res/{folder}'
    os.makedirs(p, exist_ok=True)
    bg = solid_png(size, size, *BG)
    fg = solid_png(size, size, *TEAL)
    ic = solid_png(size, size, *TEAL)
    for name, data in [('ic_launcher.png',ic),('ic_launcher_round.png',ic),
                        ('ic_launcher_background.png',bg),('ic_launcher_foreground.png',fg)]:
        with open(f'{p}/{name}', 'wb') as f: f.write(data)
    print(f'  {folder}/ ({size}x{size})')

# ── Android splash (1x1 = solid color, stretched via CENTER_CROP) ──
print("Android splash...")
px = solid_png(1, 1, *SPLASH_BG)
for d in ['drawable','drawable-v24']:
    p = f'/Users/vangitech/Projects/Sugarcare/frontend/android/app/src/main/res/{d}/splash.png'
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'wb') as f: f.write(px)
print('  splash.png (1x1 — crisp solid color)')

# ── iOS App Icon ──
print("iOS app icon...")
icon = solid_png(1024, 1024, *TEAL)
p = '/Users/vangitech/Projects/Sugarcare/frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'
os.makedirs(os.path.dirname(p), exist_ok=True)
with open(p, 'wb') as f: f.write(icon)
print('  AppIcon-512@2x.png (1024x1024)')

# ── iOS Splash (1x1) ──
print("iOS splash...")
px_ios = solid_png(1, 1, *SPLASH_BG)
d = '/Users/vangitech/Projects/Sugarcare/frontend/ios/App/App/Assets.xcassets/Splash.imageset'
os.makedirs(d, exist_ok=True)
for n in ['splash-2732x2732.png','splash-2732x2732-1.png','splash-2732x2732-2.png',
          'Default@1x~universal~anyany-dark.png','Default@2x~universal~anyany-dark.png',
          'Default@3x~universal~anyany-dark.png']:
    with open(f'{d}/{n}', 'wb') as f: f.write(px_ios)
print('  iOS splash (1x1 — crisp solid color)')

print('\nDone!')
