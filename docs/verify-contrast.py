#!/usr/bin/env python3
"""
Contrast verification for Gothic Influence.

Three bugs in this theme shared one signature: the default combination looked
correct, and only a non-default one exposed the failure.

  1. scheme-inverse read a custom property it redefined in the same rule, so
     ground and text collapsed to one colour.
  2. scheme-brand never re-pointed the text colour, so on the light preset it
     rendered dark-on-dark.
  3. The hero overlay flipped with the preset but not with the photo, so each
     preset failed on a photo of the opposite tone.

Each was found by hand, one at a time, after the previous fix. This script
checks the whole matrix at once instead.

    python docs/verify-contrast.py

Exits non-zero if anything fails, so it can gate a commit.

Keep PRESETS in sync with snippets/design-tokens.liquid. If you add a preset
or a colour scheme there, add it here too — an unchecked combination is
exactly how the three bugs above shipped.
"""

import colorsys
import sys

# ---------------------------------------------------------------- helpers

def _rgb(h):
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def luminance(h):
    def chan(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (chan(c) for c in _rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def brightness(h):
    """Shopify's color_brightness. Over 128 counts as a light colour."""
    r, g, b = _rgb(h)
    return (r * 299 + g * 587 + b * 114) / 1000


def adjust(h, points):
    """Shopify's color_lighten / color_darken: HSL lightness plus points."""
    r, g, b = (c / 255 for c in _rgb(h))
    hue, lit, sat = colorsys.rgb_to_hls(r, g, b)
    r, g, b = colorsys.hls_to_rgb(hue, min(1.0, max(0.0, lit + points / 100)), sat)
    return "#%02x%02x%02x" % (round(r * 255), round(g * 255), round(b * 255))


def mix(a, b, pct):
    """CSS color-mix(in srgb, a pct%, b)."""
    A, B, t = _rgb(a), _rgb(b), pct / 100
    return "#%02x%02x%02x" % tuple(round(A[i] * t + B[i] * (1 - t)) for i in range(3))


def blend(over, under, alpha):
    """A translucent layer composited over an opaque one."""
    O, U = _rgb(over), _rgb(under)
    return "#%02x%02x%02x" % tuple(round(O[i] * alpha + U[i] * (1 - alpha)) for i in range(3))


# WCAG AA. Large text is 24px or 18.66px bold; everything else is normal.
# Checking a 60px headline against 4.5 wastes design headroom. Checking a 16px
# subheading against 3.0 ships a defect.
AA_NORMAL = 4.5
AA_LARGE = 3.0
AA_UI = 3.0

# ---------------------------------------------------------------- palettes

PRESETS = {
    "Gothic Influence": dict(bg="#0b0c0b", surface="#121513", line="#262b27",
                             text="#e8ebe9", muted="#949c96",
                             brand="#2d6a40", brand_text="#7fb392",
                             accent="#c6a15b", accent_text="#d9bc7e"),
    "Onyx & Brass":     dict(bg="#0a0a0a", surface="#141414", line="#282828",
                             text="#ededed", muted="#9a9a9a",
                             brand="#3a3a3a", brand_text="#c0c0c0",
                             accent="#b08d57", accent_text="#d4b483"),
    "Conservatory":     dict(bg="#0a120d", surface="#101c14", line="#1f3327",
                             text="#e6ece8", muted="#8fa697",
                             brand="#356b47", brand_text="#8cc4a1",
                             accent="#c9a961", accent_text="#dcc38a"),
    "Cathedral":        dict(bg="#0d0b12", surface="#16131d", line="#2a2536",
                             text="#e9e7ef", muted="#9a95a8",
                             brand="#3f3a5c", brand_text="#a9a2c4",
                             accent="#b8bcc8", accent_text="#d3d6de"),
    "Porcelain":        dict(bg="#f3efe7", surface="#fbf9f4", line="#d8d0c2",
                             text="#17141a", muted="#5d5561",
                             brand="#4a2b3d", brand_text="#6d3f55",
                             accent="#8f7130", accent_text="#7a5f26"),
}

failures = []


def check(label, fg, bg, minimum):
    r = ratio(fg, bg)
    ok = r >= minimum
    if not ok:
        failures.append(f"{label}: {r:.2f}:1 (needs {minimum})")
    return r, ok


def derived(p):
    """Mirrors the branching in snippets/design-tokens.liquid."""
    light = brightness(p["bg"]) > 128
    return {
        "light": light,
        "on_dark": p["bg"] if light else p["text"],
        "on_accent": "#ffffff" if light else p["bg"],
        "brand_bg": p["brand"] if light else adjust(p["brand"], -26),
        "raised": adjust(p["surface"], -4 if light else 3),
    }


# ------------------------------------------------------------- 1. palettes
print("1. PALETTES\n")
print(f"{'PRESET':<18}{'text':>7}{'muted':>7}{'brand_t':>9}{'acc_txt':>9}{'accent':>8}{'on-acc':>8}")
for name, p in PRESETS.items():
    d = derived(p)
    rows = [
        (f"{name} text", p["text"], AA_NORMAL),
        (f"{name} muted", p["muted"], AA_NORMAL),
        (f"{name} brand_text", p["brand_text"], AA_NORMAL),
        (f"{name} accent_text", p["accent_text"], AA_NORMAL),
        (f"{name} accent as UI", p["accent"], AA_UI),
    ]
    vals = [check(lbl, c, p["bg"], m)[0] for lbl, c, m in rows]
    oa = check(f"{name} text on accent fill", d["on_accent"], p["accent"], AA_NORMAL)[0]
    print(f"{name:<18}{vals[0]:>7.1f}{vals[1]:>7.1f}{vals[2]:>9.1f}{vals[3]:>9.1f}{vals[4]:>8.1f}{oa:>8.1f}")

# ------------------------------------------------ 2. schemes x presets
print("\n2. COLOUR SCHEMES, EVERY PRESET\n")
print(f"{'PRESET':<18}{'SCHEME':<10}{'GROUND':>10}{'text':>8}{'muted':>8}")
for name, p in PRESETS.items():
    d = derived(p)
    schemes = {
        "default": (p["bg"], p["text"], p["muted"]),
        "surface": (p["surface"], p["text"], p["muted"]),
        "raised":  (d["raised"], p["text"], p["muted"]),
        "brand":   (d["brand_bg"], d["on_dark"], mix(d["on_dark"], d["brand_bg"], 78)),
        "accent":  (mix(p["accent"], p["bg"], 14), p["text"], p["muted"]),
        "inverse": (p["text"], p["bg"], mix(p["bg"], p["text"], 78)),
    }
    for sname, (ground, text, muted) in schemes.items():
        rt = check(f"{name} x scheme-{sname} text", text, ground, AA_NORMAL)[0]
        rm = check(f"{name} x scheme-{sname} muted", muted, ground, AA_NORMAL)[0]
        print(f"{name:<18}{sname:<10}{ground:>10}{rt:>8.2f}{rm:>8.2f}")

# --------------------------------------------------- 3. hero over photos
# The hero scrim flips with the preset, but the merchant's photo does not.
# Each preset fails on a photo of the opposite tone, so both extremes matter.
print("\n3. HERO TEXT OVER PHOTOGRAPHY\n")
print("wash range 20-90%, radial scrim 0.8 core / 0.6 mid, worst-case photo")
print(f"\n{'PRESET':<18}{'title':>8}{'subheading':>12}")
for name, p in PRESETS.items():
    d = derived(p)
    photo = "#000000" if d["light"] else "#ffffff"
    worst_t = worst_s = 99.0
    for wash in (0.20, 0.50, 0.90):
        for radial in (0.6, 0.8):
            coverage = 1 - (1 - wash) * (1 - radial)
            ground = blend(p["bg"], photo, coverage)
            worst_t = min(worst_t, ratio(p["text"], ground))
            worst_s = min(worst_s, ratio(p["text"], ground))
    check(f"{name} hero title", p["text"], blend(p["bg"], photo, 0.52), AA_LARGE)
    check(f"{name} hero subheading",
          p["text"], blend(p["bg"], photo, 1 - (1 - 0.20) * (1 - 0.6)), AA_NORMAL)
    print(f"{name:<18}{worst_t:>8.2f}{worst_s:>12.2f}")

# ------------------------------------------------------------------ result
print("\n" + "=" * 60)
if failures:
    print(f"FAILED — {len(failures)} check(s):\n")
    for f in failures:
        print("  " + f)
    sys.exit(1)
print("PASSED — every palette, scheme and hero combination meets WCAG AA.")
