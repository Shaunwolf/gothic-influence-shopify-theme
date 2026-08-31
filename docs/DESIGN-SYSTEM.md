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

## 3. Design presets

One control in theme settings re-tints the whole storefront. `snippets/design-tokens.liquid`
holds all five palettes and is rendered by both layouts, so the storefront and
the password page can never drift apart.

| Preset | Ground | Character |
|---|---|---|
| Gothic Influence | `#0b0c0b` | Near-black, forest green, gold. The default. |
| Onyx & Brass | `#0a0a0a` | Neutral black, warm brass, no green. |
| Conservatory | `#0a120d` | Green-forward, softer gold. |
| Cathedral | `#0d0b12` | Violet-noir with silver instead of gold. |
| Porcelain | `#f5f2ec` | Light stone, ink text, antique gold. |

Picking **Custom** hands control back to the individual colour settings.

**Colours branch; fonts do not.** Five font pairings cannot be preloaded
without a render-blocking cost, so typography stays on the font pickers and
the merchant sets it once.

### Making a light preset work on a dark-first theme

Porcelain is the reason several things in `base.css` are tokens rather than
literals. Translucent chrome sitting on the page ground — the header backdrop,
badges, the gallery badge, the sticky add-to-cart bar — was written as
`rgb(11 12 11 / 0.72)`, which silently assumes a dark ground. Those now use
channel triplets:

```css
background: rgb(var(--bg-rgb) / 0.72);
```

The snippet measures the background once with `color_brightness` and derives
everything conditional from that single value:

| Token | Dark preset | Light preset |
|---|---|---|
| `--color-on-accent` | the page ground | `#ffffff` |
| `--hover-tint` | `rgb(255 255 255 / 0.04)` | `rgb(0 0 0 / 0.05)` |
| `--color-surface-raised` | surface lightened | surface darkened |
| `--color-line-strong` | line lightened | line darkened |

`--color-on-accent` matters more than it looks. Gold takes dark text at
6–10:1 on the dark presets, but Porcelain's darker gold needs white — 4.59:1.
Hardcoding either one breaks half the presets.

**What deliberately stays dark:** collection-tile gradients, the drawer
scrim, lantern-card caption scrims, and lookbook hotspot backgrounds. Those
overlay photography with white text on top, and must stay dark regardless of
preset. Don't "fix" them.

**The exception — the hero** flips its scrim with the preset (`--color-bg`)
because its text uses the preset tokens too; scrim and text move together.
That only works because a second radial scrim sits behind the text block
(see `hero.liquid`), which brings the worst case to ~9:1 even at 0% base
overlay.

**The rule that catches this trap:** any overlay whose colour flips with the
preset must be contrast-checked against BOTH a black and a white photo, not
just against its own preset's ground. Each preset fails when the merchant's
photo runs opposite to its scrim — Gothic with a bright airy hero shot is the
common real-world case, and it is the default preset.

Two corollaries: when the scrim is a gradient rather than a flat fill, check
contrast at the WEAKEST stop the text can actually reach — a long headline
extends well past the centre, and the centre is the case that always looks
fine. And when a merchant-facing setting controls scrim strength, its range
must exclude values that fail at any photo tone — the hero overlay's minimum
is 20% for exactly this reason, not 0%.

**Use the right threshold.** 3:1 for text at 24px+ (or 18.66px+ bold),
4.5:1 for everything else. Checking a 60px headline against 4.5 wastes
design headroom; checking a 16px subheading against 3.0 ships a defect.
When one element passes and its neighbour fails, it is usually because
they sit on different sides of this line.

**Opacity on text is a contrast multiplier, not a style choice.** Any
element that sets both a colour token and an opacity must be measured at
the composited value, and no scrim behind it can compensate past the cap
the opacity imposes. Reducing opacity to signal hierarchy is exactly the
pattern that quietly breaks AA — size and weight express hierarchy
without touching contrast, so use those instead.

### Contrast

Every preset is verified to WCAG AA — text, secondary text, prices, links and
brand text all clear 4.5:1, and the accent clears 3:1 as a UI colour. Custom
colours are not checked for the merchant, which the settings panel says
plainly.

Brand colour remains fills-only in every preset; `--color-brand-text` is the
readable variant.

---

## 4. Type

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

## 5. Space, shape, motion

**Space** — 4px base: `4 8 12 16 24 32 48 64 96 128 160`. Sections use `--sp-9` (96px), dropping to `--sp-7` (48px) on mobile.

**Radius** — `2px`. Near-sharp. Soft corners read approachable; sharp corners read expensive. Only badges and the cart bubble are pills.

**Elevation** — on a near-black ground a drop shadow is almost invisible, so elevation is carried by **surface lift + a brighter hairline**, not shadow. Shadows exist only for genuinely floating layers (menus, drawers, hotspot cards).

**Motion** — `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, an expo-out curve that decelerates hard. Durations: 150 / 250 / 400 / 600ms. Hovers at 250–400ms; panels at 600ms.

Two signature moves:
- **Button wipe** — the fill scales up from `transform-origin: bottom` rather than swapping colour. A sweep reads intentional; a swap reads abrupt.
- **Underline grow** — nav and quiet links scale a 1px rule from `transform-origin: left`, giving direction.

Everything collapses to `0.01ms` under `prefers-reduced-motion: reduce`.

---

## 6. Component contracts

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

## 7. Why the cart re-renders from Liquid

Every cart mutation refetches `?section_id=cart-drawer` and swaps the HTML rather than rebuilding rows in JavaScript.

It costs one request. It buys correct money formatting in every currency, correct discount lines, correct translations, and one place to change markup. Rebuilding cart rows in JS is the most common source of "the price is wrong in EUR" bugs in custom themes.

---

## 8. Accessibility floor

Non-negotiable, and all of it is already in place:

- Every interactive target ≥ 44 × 44px
- Visible `:focus-visible` ring — 2px gold, 3px offset
- Drawers trap focus, close on `Escape`, restore focus to the opener
- Colour never the sole carrier of meaning (sold-out options get a diagonal strike, not just opacity)
- `prefers-reduced-motion` honoured globally
- Skip link, landmark roles, live region for the toast

The one thing to watch: the product card's full-card click target uses a stretched pseudo-element from the title link. Quick-add sits at `z-index: 2` to stay clickable above it. If you add another control to a card, it needs the same treatment.

---

## 9. CSS custom property traps

**A rule cannot read the pre-override value of a property it redefines.**
Custom properties resolve against the element's *computed* value, including
declarations in the same rule. Declaration order does not help.

```css
/* BROKEN — background, color and muted all collapse to --color-bg */
.scheme-inverse {
  background: var(--color-text);
  --color-text: var(--color-bg);
  --color-text-muted: color-mix(in srgb, var(--color-bg) 78%, var(--color-text));
  color: var(--color-text);
}
```

`background` resolves `--color-text` to its new value, so ground and text
become the same colour and the section renders invisible. The muted mix
collapses the same way.

The fix is aliases the schemes never re-point. `snippets/design-tokens.liquid`
emits `--fixed-bg` and `--fixed-text` alongside the semantic tokens, and any
scheme that flips foreground and ground reads those instead.

**Every scheme also publishes `--scheme-bg`,** naming its own actual ground.
A scrim or gradient inside a section cannot assume the page background — under
`scheme-surface` or `scheme-inverse` it would blend against the wrong colour.
Write overlays as `var(--scheme-bg, var(--color-bg))`.

This is the same failure shape as the both-photos rule in section 3: the
default case looks correct, and only a non-default combination exposes it.

---

## 10. Liquid house rules

Three separate passes over this theme hit the same four traps. They all pass a
casual read and fail `shopify theme check`, so they are worth memorising.

**Never end a named argument with a filter if another argument follows.**
The filter chain swallows the comma and everything after it.

```liquid
{%- comment -%} breaks: "Filter 'escape' has trailing characters" {%- endcomment -%}
{{ img | image_tag: alt: product.title | escape, class: 'card__img' }}

{%- comment -%} correct — image_tag escapes attribute values itself {%- endcomment -%}
{{ img | image_tag: alt: product.title, class: 'card__img' }}
```

The same applies to `t:` named arguments. If a value genuinely needs a filter,
`assign` it first and pass the variable.

**Inside a `liquid` tag, every line is a separate statement.** A filter chain
cannot wrap.

```liquid
{%- comment -%} breaks {%- endcomment -%}
{%- liquid
  assign total = a.size
    | plus: b.size
-%}

{%- comment -%} correct {%- endcomment -%}
{%- liquid
  assign total = a.size | plus: b.size
-%}
```

**`form` only exists inside `{% form %}`.** A `form.posted_successfully?` or
`form.errors` check placed after `{% endform %}` is silently always false, so
the success message never appears. Put both inside the form.

**Do not write Liquid tag syntax inside a comment.** The parser still reads it.
Refer to a `liquid` tag or a `form` tag in prose instead of `{% ... %}`.

---

## 11. Extending it

When you add a section:

1. Use tokens. A raw hex will not respond to merchant settings.
2. Give every text string a `{% schema %}` setting — merchants should never edit Liquid.
3. Add a `presets` block so it appears in *Add section*.
4. Render placeholders when no content is selected, or merchants see an empty box and assume it is broken.
5. Add `class="reveal"` for scroll-in, gated on `settings.enable_reveal`.
6. Run `shopify theme check` before pushing.
