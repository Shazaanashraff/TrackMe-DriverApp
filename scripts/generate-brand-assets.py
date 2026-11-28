"""Regenerate Pingo brand assets (icon, adaptive icon, monochrome, splash, favicon, Play graphics).

Usage:  python scripts/generate-brand-assets.py [rider|driver]   (run from an app root)

Pure PIL, no SVG renderer needed. Everything is drawn at 4x and downsampled for clean edges.
rider  = Signal-blue tile (#2563EB), driver = deep-navy tile (#172033) so both apps are
         distinguishable on a home screen. The mark is a bus with a location pin ("ping").
"""
import os
import sys
from PIL import Image, ImageDraw

VARIANT = sys.argv[1] if len(sys.argv) > 1 else "rider"
BG = {"rider": "#2563EB", "driver": "#172033"}[VARIANT]
BUS = "#FFFFFF"
HOLE = BG  # windows / pin eye show the tile colour
SS = 4  # supersample


def mark(size, scale=1.0, fill=BUS, hole=HOLE, hole_alpha=True):
    """Return an RGBA image of the bus+pin mark centred in `size`px, mark spans ~`scale` of the canvas."""
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = S * scale / 100.0  # 1 unit = 1% of mark box
    ox = oy = S * (1 - scale) / 2

    def P(x, y):
        return (ox + x * u, oy + y * u)

    def rr(x0, y0, x1, y1, r, col):
        d.rounded_rectangle([*P(x0, y0), *P(x1, y1)], radius=r * u, fill=col)

    # bus body
    rr(4, 42, 96, 84, 9, fill)
    # windows (cut out)
    wc = (0, 0, 0, 0) if hole_alpha else hole
    for x0, x1 in ((11, 29), (33, 51), (55, 73)):
        rr(x0, 49, x1, 64, 3, wc)
    d.polygon([P(77, 49), P(89, 49), P(89, 64), P(77, 64)], fill=wc)
    # wheels: hole ring then fill
    for cx in (27, 73):
        d.ellipse([*P(cx - 11, 74), *P(cx + 11, 96)], fill=wc)
        d.ellipse([*P(cx - 7.5, 77.5), *P(cx + 7.5, 92.5)], fill=fill)
    # pin above the bus: circle + point, with a ring cut-out between pin and bus
    pcx, pcy, pr = 50, 22, 17
    ring = pr + 4.5
    d.ellipse([*P(pcx - ring, pcy - ring), *P(pcx + ring, pcy + ring)], fill=wc)
    d.polygon([P(pcx - ring * 0.86, pcy + ring * 0.5), P(pcx + ring * 0.86, pcy + ring * 0.5), P(pcx, 50)], fill=wc)
    d.ellipse([*P(pcx - pr, pcy - pr), *P(pcx + pr, pcy + pr)], fill=fill)
    d.polygon([P(pcx - pr * 0.87, pcy + pr * 0.5), P(pcx + pr * 0.87, pcy + pr * 0.5), P(pcx, 46)], fill=fill)
    d.ellipse([*P(pcx - 7, pcy - 7), *P(pcx + 7, pcy + 7)], fill=wc if hole_alpha else hole)
    return img.resize((size, size), Image.LANCZOS)


def flatten(fg, bg_hex):
    base = Image.new("RGBA", fg.size, bg_hex)
    base.alpha_composite(fg)
    return base.convert("RGB")


os.makedirs("assets", exist_ok=True)
os.makedirs("store-assets", exist_ok=True)

# 1) icon.png — opaque, full-bleed square (stores round it themselves)
flatten(mark(1024, 0.62), BG).save("assets/icon.png")

# 2) adaptive-icon.png — transparent foreground; Android safe zone is the centre 66%
mark(1024, 0.54).save("assets/adaptive-icon.png")

# 3) monochrome (Android 13 themed icons) — single-colour silhouette on transparency
mono = mark(1024, 0.54, fill="#000000")
mono.save("assets/adaptive-icon-monochrome.png")

# 4) splash — transparent mark, contain-resized on the app's splash colour
mark(1024, 0.50).save("assets/splash.png")

# 5) favicon (web)
flatten(mark(96, 0.74), BG).resize((48, 48), Image.LANCZOS).save("assets/favicon.png")

# 6) Play Console: 512x512 icon + 1024x500 feature graphic
flatten(mark(1024, 0.62), BG).resize((512, 512), Image.LANCZOS).save("store-assets/play-icon-512.png")
from PIL import ImageFont
fg = Image.new("RGB", (1024, 500), BG)
m = mark(300, 0.9)
fg.paste(m, (120, 100), m)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 130)
    sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 40)
except OSError:
    font = sub = ImageFont.load_default()
td = ImageDraw.Draw(fg)
td.text((450, 150), "Pingo", font=font, fill="#FFFFFF")
td.text((455, 300), "Driver" if VARIANT == "driver" else "Live shuttle tracking", font=sub, fill="#C7D6FF")
fg.save("store-assets/feature-graphic-1024x500.png")
print("wrote", VARIANT, "assets")
