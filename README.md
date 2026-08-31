# Gothic Influence

A dark, luxury Shopify theme for home decor. Near-black grounds, forest green, restrained gold.

Built on Online Store 2.0 — JSON templates, section groups, and schema-driven settings, so the store can be rearranged in the theme editor without touching code.

---

## Install

**Option A — upload a ZIP**

```bash
git archive --format=zip --output=gothic-influence.zip HEAD
```

Then in Shopify admin: **Online Store → Themes → Add theme → Upload ZIP file**.

**Option B — Shopify CLI (recommended while developing)**

```bash
npm install -g @shopify/cli @shopify/theme
```

```bash
shopify theme dev --store your-store.myshopify.com
```

That gives a live preview on `localhost:9292` that hot-reloads as you edit.

To push a copy to the store without publishing it:

```bash
shopify theme push --unpublished --theme "Gothic Influence"
```

Lint before every push:

```bash
shopify theme check
```

---

## After installing

Three things are needed before the theme looks like the demo:

1. **Menus** — create `main-menu` and `footer` under *Content → Menus*. Nested menu items automatically become a mega menu.
2. **Filters** — install Shopify's free **Search & Discovery** app and add filters (material, colour, room, price). The collection page renders whatever you configure there; without it you get sorting only.
3. **Collections** — assign collections to the *Collection list* and *Featured collection* sections in the theme editor.

---

## Structure

```
assets/
  base.css              Design tokens + every component style
  theme.js              Cart drawer, predictive search, variants, sticky ATC
config/
  settings_schema.json  Merchant-facing settings (colours, type, cart, cards)
  settings_data.json    Defaults + three colour presets
layout/
  theme.liquid          Injects tokens from settings, loads fonts, assets
locales/
  en.default.json       All customer-facing strings
sections/
  header-group.json     Announcement bar + header
  footer-group.json     Newsletter + footer
  main-*.liquid         Page bodies (collection, cart, search, blog, 404…)
  *.liquid              Homepage sections, each with a preset
snippets/
  product-card.liquid   The single card used everywhere
  price.liquid          Ranges, sale, unit pricing
  meta-tags.liquid      Open Graph + JSON-LD structured data
  icon.liquid           Inline SVG sprite
templates/
  *.json                Which sections each page renders
```

---

## What's built in

| Feature | Where |
|---|---|
| Mega menu with image tiles | `sections/header.liquid` — blocks, no app needed |
| Predictive search drawer | `sections/predictive-search.liquid` + `<predictive-search>` |
| Ajax cart drawer | `sections/cart-drawer.liquid` + `<cart-drawer>` |
| Free-shipping progress | Cart drawer, threshold in theme settings |
| Quick add from a card | `snippets/product-card.liquid` + `<quick-add>` |
| Variant swatches + image swap | `<variant-picker>` in `theme.js` |
| Sticky add-to-cart bar | `sections/sticky-atc.liquid` |
| Shoppable lookbook hotspots | `sections/shoppable-lookbook.liquid` |
| Filtering + sorting without reload | `sections/main-collection.liquid` + `<facet-filters>` |
| Product JSON-LD | `snippets/meta-tags.liquid` |

---

## Design system

Tokens, colour rules, type scale and component contracts live in
[`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md). Read it before adding a
section — it explains why gold is rationed and which greens are safe for text.

---

## Conventions

**Never hardcode a colour, size or duration.** Use the tokens in
`assets/base.css`. A raw hex in a section is a bug — it will not respond to
the merchant's theme settings.

**Sections own layout; snippets own components.** If markup appears on more
than one page, it belongs in `snippets/`.

**Liquid formats money, not JavaScript.** The cart drawer and price block
re-render by fetching their own section, which keeps currency, discounts and
translations correct in every locale.

**Custom elements over `DOMContentLoaded`.** Behaviour is attached with
`customElements.define`, so sections added in the theme editor work
immediately without re-binding.

---

## Browser support

Evergreen Chrome, Edge, Firefox and Safari 15.4+. Uses `aspect-ratio`,
`:focus-visible`, `backdrop-filter` and CSS nesting-free custom properties.
All motion is disabled under `prefers-reduced-motion`.
