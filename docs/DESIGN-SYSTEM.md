# Gothic Influence — Design System

The rules behind the theme. Read this before adding a section.

---

## 1. The idea

Luxury on screen is mostly **restraint plus contrast**. Three decisions carry it:

1. **Near-black, not black.** `#0b0c0b` has a faint green cast. Pure `#000000` clips on OLED, kills any sense of depth, and makes warm gold look dirty next to it.
2. **Gold is rationed.** Gold appears as a 1px hairline, a price, a focus ring, or a small-caps label — never a large fill. The moment gold covers area, the page reads costume rather than couture.
3. **Space does the work.** Sections breathe at 96–128px. Whitespace is the single most reliable luxury signal, and it is free.

---

## 2. Colour

### Tokens

| Token | Value | Use |
|---|---|---|
| `--ink-900` | `#0b0c0b` | Page ground |
| `--ink-800` | `#121513` | Footer, drawers, inputs, menus |
| `--ink-700` | `#1a1e1b` | Hover surface, drawer footer |
| `--ink-600` | `#262b27` | Hairlines, card borders |
| `--ink-500` | `#3a403b` | Stronger borders |
| `--ink-400` | `#6b736d` | Subtle text, disabled |
| `--ink-300` | `#949c96` | Secondary text |
| `--ink-100` | `#e8ebe9` | Primary text |
| `--green-400` | `#2d6a40` | Brand fill, primary button |
| `--green-200` | `#7fb392` | Green **as text** |
| `--gold-600` | `#8a6d2f` | Hairlines, borders |
| `--gold-400` | `#c6a15b` | Focus rings, active states, badges |
| `--gold-300` | `#d9bc7e` | Prices, eyebrows, link hover |

### The one rule people break

**`--green-400` (`#2d6a40`) is a surface colour, not a text colour.**

Against `#0b0c0b` it measures roughly **2.5:1** — below the 4.5:1 WCAG AA floor for body text and below 3:1 even for large text. When green must appear as text, use `--green-200` (`#7fb392`, ~7:1).

Measured against `--ink-900`:

| Foreground | Ratio | Verdict |
|---|---|---|
| `--ink-100` `#e8ebe9` | ~16:1 | Anything |
| `--ink-300` `#949c96` | ~5.8:1 | Body text ✅ |
| `--ink-400` `#6b736d` | ~3.1:1 | Large text / decorative only |
| `--gold-300` `#d9bc7e` | ~10:1 | Anything |
| `--gold-400` `#c6a15b` | ~7.6:1 | Anything |
| `--green-200` `#7fb392` | ~7:1 | Anything |
| `--green-400` `#2d6a40` | ~2.5:1 | **Fills only** ❌ |

If you change the palette in theme settings, re-check the muted text colour first — it is the one most likely to fall below AA.

### Where gold is allowed

✅ 1px borders and the centred `.rule` divider
✅ Prices and the `.eyebrow` small-caps label
✅ Focus rings, active option outlines, the cart count bubble
✅ Hover state on quiet links
✅ Icons at 26px or smaller

❌ Large background fills
❌ Body copy
❌ More than roughly 5% of any viewport

---

## 3. Type

Two families. A high-contrast serif for display, a clean sans for everything else.

- **Display** — Playfair Display by default, set at `--fw-normal` (400). Luxury serifs want *air*, not weight; bold display type reads loud, not expensive.
- **Body** — Poppins at **300**. The light weight plus generous line height is what separates this from a generic dark theme.

Both load through Shopify's `font_picker` and `font_face`, served from `cdn.shopify.com`. This is deliberately **not** a `<link>` to `fonts.googleapis.com` — that would add a render-blocking request to a third-party origin and cost roughly 100–300ms on first paint.

### Scale

Fluid via `clamp()`, so nothing needs a breakpoint.

| Token | Range | Use |
|---|---|---|
| `--fs-xs` | 12px | Eyebrows, buttons, nav, badges |
| `--fs-sm` | 13px | Meta, captions |
| `--fs-base` | 16px | Body |
| `--fs-md` | 17px | Card titles, lede |
| `--fs-lg` | 20 → 24px | h4 |
| `--fs-xl` | 24 → 32px | h3, quotes |
| `--fs-2xl` | 32 → 48px | h2, product title |
| `--fs-3xl` | 40 → 72px | h1 |
| `--fs-4xl` | 48 → 96px | Hero |

### Tracking

`--track-caps: 0.18em` on every uppercase label. This is the highest-leverage typographic setting in the theme — tight uppercase reads cheap, open uppercase reads considered. It is exposed as a merchant setting.

---

## 4. Space, shape, motion

**Space** — 4px base: `4 8 12 16 24 32 48 64 96 128 160`. Sections use `--sp-9` (96px), dropping to `--sp-7` (48px) on mobile.

**Radius** — `2px`. Near-sharp. Soft corners read approachable; sharp corners read expensive. Only badges and the cart bubble are pills.

**Elevation** — on a near-black ground a drop shadow is almost invisible, so elevation is carried by **surface lift + a brighter hairline**, not shadow. Shadows exist only for genuinely floating layers (menus, drawers, hotspot cards).

**Motion** — `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, an expo-out curve that decelerates hard. Durations: 150 / 250 / 400 / 600ms. Hovers at 250–400ms; panels at 600ms.

Two signature moves:
- **Button wipe** — the fill scales up from `transform-origin: bottom` rather than swapping colour. A sweep reads intentional; a swap reads abrupt.
- **Underline grow** — nav and quiet links scale a 1px rule from `transform-origin: left`, giving direction.

Everything collapses to `0.01ms` under `prefers-reduced-motion: reduce`.

---

## 5. Component contracts

`theme.js` attaches behaviour via custom elements. A section only needs the right markup — no JS per section.

| Element | Required inside | Does |
|---|---|---|
| `<product-form>` | a `<form>` posting to `cart/add` | Ajax add, opens drawer |
| `<variant-picker data-url>` | `[data-variant-json]`, radio `.option__input`s, `[data-option-selected]` | Swaps price, availability, media, URL |
| `<media-gallery>` | `.gallery__slide[data-media-id]`, `.gallery__thumb[data-media-id]` | Thumbnail + variant-driven switching |
| `<cart-drawer>` | `[data-cart-contents]` | Re-renders from `?section_id=cart-drawer` |
| `<predictive-search>` | `input[type=search]`, `[data-search-results]` | Live results, arrow-key nav |
| `<quick-add data-variant-id>` | a `<button>` | One-click add |
| `<quantity-input>` | `.qty__input`, `[data-qty-step]` | Stepper |
| `<facet-filters>` | a `<form>` | Filter + sort without reload |
| `<sticky-atc>` | — | Reveals when `[data-atc-anchor]` scrolls past |
| `<announcement-bar data-speed>` | `.announcement__slide`s | Rotates |

Also required on the product page: `[data-add-button]` with an inner `[data-add-label]`, `[data-variant-id]` on the hidden id input, and `[data-price-block]` / `[data-inventory-block]` wrappers (both re-rendered from Liquid on variant change).

---

## 6. Why the cart re-renders from Liquid

Every cart mutation refetches `?section_id=cart-drawer` and swaps the HTML rather than rebuilding rows in JavaScript.

It costs one request. It buys correct money formatting in every currency, correct discount lines, correct translations, and one place to change markup. Rebuilding cart rows in JS is the most common source of "the price is wrong in EUR" bugs in custom themes.

---

## 7. Accessibility floor

Non-negotiable, and all of it is already in place:

- Every interactive target ≥ 44 × 44px
- Visible `:focus-visible` ring — 2px gold, 3px offset
- Drawers trap focus, close on `Escape`, restore focus to the opener
- Colour never the sole carrier of meaning (sold-out options get a diagonal strike, not just opacity)
- `prefers-reduced-motion` honoured globally
- Skip link, landmark roles, live region for the toast

The one thing to watch: the product card's full-card click target uses a stretched pseudo-element from the title link. Quick-add sits at `z-index: 2` to stay clickable above it. If you add another control to a card, it needs the same treatment.

---

## 8. Extending it

When you add a section:

1. Use tokens. A raw hex will not respond to merchant settings.
2. Give every text string a `{% schema %}` setting — merchants should never edit Liquid.
3. Add a `presets` block so it appears in *Add section*.
4. Render placeholders when no content is selected, or merchants see an empty box and assume it is broken.
5. Add `class="reveal"` for scroll-in, gated on `settings.enable_reveal`.
6. Run `shopify theme check` before pushing.
