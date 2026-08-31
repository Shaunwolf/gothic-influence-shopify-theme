/* ==========================================================================
   GOTHIC INFLUENCE — Theme behaviour
   Vanilla JS, no dependencies. Custom elements so sections can be added,
   removed and reordered in the theme editor without re-binding anything.
   ========================================================================== */
(function () {
  'use strict';

  const money = (cents) =>
    (window.Shopify && window.Shopify.formatMoney)
      ? window.Shopify.formatMoney(cents, window.themeStrings.moneyFormat)
      : formatMoney(cents, window.themeStrings.moneyFormat);

  /* Minimal money formatter — Shopify's own is not guaranteed to be present
     on the storefront, so we ship a fallback that handles the four standard
     placeholder styles. */
  function formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    const fmt = format || '${{amount}}';
    const placeholder = /\{\{\s*(\w+)\s*\}\}/;

    function withDelimiters(number, precision, thousands, decimal) {
      precision = precision ?? 2;
      thousands = thousands ?? ',';
      decimal = decimal ?? '.';
      if (isNaN(number) || number === null) return '0';
      number = (number / 100).toFixed(precision);
      const parts = number.split('.');
      const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      const cts = parts[1] ? decimal + parts[1] : '';
      return dollars + cts;
    }

    let value = '';
    switch (fmt.match(placeholder)?.[1]) {
      case 'amount':                 value = withDelimiters(cents, 2); break;
      case 'amount_no_decimals':     value = withDelimiters(cents, 0); break;
      case 'amount_with_comma_separator': value = withDelimiters(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = withDelimiters(cents, 0, '.', ','); break;
      case 'amount_with_space_separator': value = withDelimiters(cents, 2, ' ', ','); break;
      case 'amount_no_decimals_with_space_separator': value = withDelimiters(cents, 0, ' ', ''); break;
      default:                       value = withDelimiters(cents, 2);
    }
    return fmt.replace(placeholder, value);
  }

  const debounce = (fn, wait) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), wait); };
  };

  /* ------------------------------------------------------------------------
     Focus trap — shared by every drawer.
     ---------------------------------------------------------------------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(container, opener) {
    const nodes = () => Array.from(container.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    function onKey(e) {
      if (e.key !== 'Tab') return;
      const list = nodes();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    const target = nodes()[0];
    if (target) target.focus();
    return () => {
      container.removeEventListener('keydown', onKey);
      if (opener && document.body.contains(opener)) opener.focus();
    };
  }

  /* ------------------------------------------------------------------------
     Cart state — one source of truth, broadcast to every listener.
     ---------------------------------------------------------------------- */
  const CartBus = {
    listeners: new Set(),
    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    publish(cart) { this.listeners.forEach((fn) => fn(cart)); }
  };
  window.GothicCart = CartBus;

  async function cartRequest(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.description || data.message || 'Cart error');
    return data;
  }

  async function refreshCart() {
    const res = await fetch(window.Shopify.routes.root + 'cart.js');
    const cart = await res.json();
    CartBus.publish(cart);
    return cart;
  }

  window.addToCart = async function (items, opener) {
    await cartRequest(window.Shopify.routes.root + 'cart/add.js', { items });
    const cart = await refreshCart();
    const drawer = document.querySelector('cart-drawer');
    if (drawer) drawer.open(opener);
    return cart;
  };

  /* ------------------------------------------------------------------------
     Toast
     ---------------------------------------------------------------------- */
  let toastEl, toastTimer;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3500);
  }
  window.gothicToast = toast;

  /* ------------------------------------------------------------------------
     <site-drawer> — generic slide-out panel.
     ---------------------------------------------------------------------- */
  class SiteDrawer extends HTMLElement {
    connectedCallback() {
      this.releaseFocus = null;
      this.addEventListener('click', (e) => {
        if (e.target.closest('[data-drawer-close]') || e.target.classList.contains('drawer__scrim')) {
          this.close();
        }
      });
      this.escHandler = (e) => { if (e.key === 'Escape' && this.classList.contains('is-open')) this.close(); };
      document.addEventListener('keydown', this.escHandler);
    }
    disconnectedCallback() { document.removeEventListener('keydown', this.escHandler); }

    open(opener) {
      this.classList.add('is-open');
      document.body.classList.add('is-locked');
      this.setAttribute('aria-hidden', 'false');
      const panel = this.querySelector('.drawer__panel');
      if (panel) this.releaseFocus = trapFocus(panel, opener || document.activeElement);
    }
    close() {
      this.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      this.setAttribute('aria-hidden', 'true');
      if (this.releaseFocus) { this.releaseFocus(); this.releaseFocus = null; }
    }
  }
  customElements.define('site-drawer', SiteDrawer);

  /* Any element with [data-drawer-open="id"] toggles that drawer. */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-drawer-open]');
    if (!trigger) return;
    const drawer = document.getElementById(trigger.dataset.drawerOpen);
    if (!drawer) return;
    e.preventDefault();
    drawer.open(trigger);
  });

  /* ------------------------------------------------------------------------
     <cart-drawer> — re-renders itself from the cart section on every change.
     ---------------------------------------------------------------------- */
  class CartDrawer extends SiteDrawer {
    connectedCallback() {
      super.connectedCallback();
      this.unsub = CartBus.subscribe(() => this.render());

      this.addEventListener('click', (e) => {
        const remove = e.target.closest('[data-cart-remove]');
        if (remove) { e.preventDefault(); this.change(remove.dataset.cartRemove, 0); return; }
        const step = e.target.closest('[data-cart-step]');
        if (step) {
          e.preventDefault();
          const input = step.parentElement.querySelector('.qty__input');
          const next = Math.max(0, parseInt(input.value, 10) + parseInt(step.dataset.cartStep, 10));
          this.change(input.dataset.line, next);
        }
      });

      this.addEventListener('change', (e) => {
        const input = e.target.closest('.qty__input[data-line]');
        if (input) this.change(input.dataset.line, Math.max(0, parseInt(input.value, 10) || 0));
      });
    }

    async change(line, quantity) {
      const body = this.querySelector('.drawer__body');
      if (body) body.classList.add('is-loading');
      try {
        await cartRequest(window.Shopify.routes.root + 'cart/change.js', { line: Number(line), quantity });
        await refreshCart();
      } catch (err) {
        toast(err.message);
      } finally {
        if (body) body.classList.remove('is-loading');
      }
    }

    /* Pull fresh markup from the cart-drawer section rather than rebuilding
       the DOM in JS — keeps money formatting, discounts and translations in
       Liquid where they belong. */
    async render() {
      const url = `${window.Shopify.routes.root}?section_id=cart-drawer`;
      const res = await fetch(url);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const fresh = doc.querySelector('[data-cart-contents]');
      const current = this.querySelector('[data-cart-contents]');
      if (fresh && current) current.innerHTML = fresh.innerHTML;
    }
  }
  customElements.define('cart-drawer', CartDrawer);

  /* Header bubble count stays in sync with the bus. */
  CartBus.subscribe((cart) => {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = cart.item_count;
      el.hidden = cart.item_count === 0;
    });
  });

  /* ------------------------------------------------------------------------
     <product-form> — ajax add to cart.
     ---------------------------------------------------------------------- */
  class ProductForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      if (!this.form) return;
      this.button = this.querySelector('[type="submit"]');
      this.form.addEventListener('submit', this.onSubmit.bind(this));
    }

    async onSubmit(e) {
      e.preventDefault();
      if (this.button.hasAttribute('disabled')) return;

      const original = this.button.innerHTML;
      this.button.classList.add('is-loading');
      this.button.innerHTML = '<span class="spinner" aria-hidden="true"></span>';

      const data = new FormData(this.form);
      try {
        await window.addToCart([{
          id: Number(data.get('id')),
          quantity: Number(data.get('quantity') || 1)
        }], this.button);
      } catch (err) {
        toast(err.message || window.themeStrings.cartError);
      } finally {
        this.button.classList.remove('is-loading');
        this.button.innerHTML = original;
      }
    }
  }
  customElements.define('product-form', ProductForm);

  /* ------------------------------------------------------------------------
     <variant-picker> — swaps price, availability, gallery and the URL.
     ---------------------------------------------------------------------- */
  class VariantPicker extends HTMLElement {
    connectedCallback() {
      this.section = this.closest('[data-section-id]');
      const script = this.querySelector('[data-variant-json]');
      this.variants = script ? JSON.parse(script.textContent) : [];
      this.addEventListener('change', this.onChange.bind(this));
    }

    get selectedOptions() {
      return Array.from(this.querySelectorAll('input[type="radio"]:checked, select'))
        .map((el) => el.value);
    }

    onChange() {
      const chosen = this.selectedOptions;
      const variant = this.variants.find((v) =>
        v.options.every((opt, i) => opt === chosen[i]));

      this.updateOptionLabels(chosen);
      if (!variant) return this.setUnavailable();

      this.setAvailable(variant);
      this.updateUrl(variant);
      this.updateMedia(variant);
      this.updatePrice(variant);
    }

    updateOptionLabels(chosen) {
      this.querySelectorAll('[data-option-selected]').forEach((el, i) => {
        el.textContent = chosen[i] || '';
      });
    }

    setUnavailable() {
      const btn = this.section?.querySelector('[data-add-button]');
      if (!btn) return;
      btn.setAttribute('disabled', '');
      const label = btn.querySelector('[data-add-label]') || btn;
      label.textContent = window.themeStrings.unavailable;
    }

    setAvailable(variant) {
      const btn = this.section?.querySelector('[data-add-button]');
      const idInput = this.section?.querySelector('[data-variant-id]');
      if (idInput) idInput.value = variant.id;
      if (!btn) return;
      const label = btn.querySelector('[data-add-label]') || btn;
      if (variant.available) {
        btn.removeAttribute('disabled');
        label.textContent = window.themeStrings.addToCart;
      } else {
        btn.setAttribute('disabled', '');
        label.textContent = window.themeStrings.soldOut;
      }
    }

    updateUrl(variant) {
      if (!variant || this.dataset.updateUrl === 'false') return;
      window.history.replaceState({}, '', `${this.dataset.url}?variant=${variant.id}`);
    }

    updateMedia(variant) {
      if (!variant.featured_media) return;
      const gallery = this.section?.querySelector('media-gallery');
      if (gallery) gallery.selectByMediaId(String(variant.featured_media.id));
    }

    /* Re-render the price block from Liquid so currency, unit pricing and
       sale badges stay correct in every locale. */
    async updatePrice(variant) {
      const sectionId = this.section?.dataset.sectionId;
      if (!sectionId) return;
      const url = `${this.dataset.url}?variant=${variant.id}&section_id=${sectionId}`;
      try {
        const res = await fetch(url);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        ['[data-price-block]', '[data-inventory-block]'].forEach((sel) => {
          const fresh = doc.querySelector(sel);
          const current = this.section.querySelector(sel);
          if (fresh && current) current.innerHTML = fresh.innerHTML;
        });
      } catch (_) { /* price stays as-is if the fetch fails */ }
    }
  }
  customElements.define('variant-picker', VariantPicker);

  /* ------------------------------------------------------------------------
     <media-gallery>
     ---------------------------------------------------------------------- */
  class MediaGallery extends HTMLElement {
    connectedCallback() {
      this.slides = Array.from(this.querySelectorAll('.gallery__slide'));
      this.thumbs = Array.from(this.querySelectorAll('.gallery__thumb'));
      this.thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => this.selectByMediaId(thumb.dataset.mediaId));
      });
    }
    selectByMediaId(id) {
      this.slides.forEach((s) => s.classList.toggle('is-active', s.dataset.mediaId === id));
      this.thumbs.forEach((t) => t.setAttribute('aria-current', String(t.dataset.mediaId === id)));
      const active = this.thumbs.find((t) => t.dataset.mediaId === id);
      if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }
  customElements.define('media-gallery', MediaGallery);

  /* ------------------------------------------------------------------------
     <predictive-search>
     ---------------------------------------------------------------------- */
  class PredictiveSearch extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input[type="search"]');
      this.panel = this.querySelector('[data-search-results]');
      if (!this.input || !this.panel) return;

      this.input.setAttribute('role', 'combobox');
      this.input.setAttribute('aria-expanded', 'false');
      this.input.setAttribute('aria-autocomplete', 'list');

      this.input.addEventListener('input', debounce(() => this.search(), 250));
      this.input.addEventListener('focus', () => { if (this.input.value.length > 1) this.show(); });
      document.addEventListener('click', (e) => { if (!this.contains(e.target)) this.hide(); });
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { this.hide(); this.input.focus(); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') this.move(e);
      });
    }

    move(e) {
      const items = Array.from(this.panel.querySelectorAll('.search-result'));
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown'
        ? (i + 1) % items.length
        : (i <= 0 ? items.length - 1 : i - 1);
      items[next].focus();
    }

    show() { this.panel.hidden = false; this.input.setAttribute('aria-expanded', 'true'); }
    hide() { this.panel.hidden = true; this.input.setAttribute('aria-expanded', 'false'); }

    async search() {
      const q = this.input.value.trim();
      if (q.length < 2) return this.hide();
      const params = new URLSearchParams({
        q,
        'resources[type]': 'product,collection,page,article',
        'resources[limit]': '6',
        section_id: 'predictive-search'
      });
      try {
        const res = await fetch(`${window.Shopify.routes.root}search/suggest?${params}`);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const fresh = doc.querySelector('[data-search-results]');
        if (fresh) { this.panel.innerHTML = fresh.innerHTML; this.show(); }
      } catch (_) { this.hide(); }
    }
  }
  customElements.define('predictive-search', PredictiveSearch);

  /* ------------------------------------------------------------------------
     <quick-add> — add a single-variant product straight from a card.
     ---------------------------------------------------------------------- */
  class QuickAdd extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector('button');
      if (!this.button) return;
      this.button.addEventListener('click', async (e) => {
        e.preventDefault();
        const original = this.button.innerHTML;
        this.button.classList.add('is-loading');
        this.button.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
        try {
          await window.addToCart([{ id: Number(this.dataset.variantId), quantity: 1 }], this.button);
        } catch (err) {
          toast(err.message || window.themeStrings.cartError);
        } finally {
          this.button.classList.remove('is-loading');
          this.button.innerHTML = original;
        }
      });
    }
  }
  customElements.define('quick-add', QuickAdd);

  /* ------------------------------------------------------------------------
     <quantity-input>
     ---------------------------------------------------------------------- */
  class QuantityInput extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('.qty__input');
      this.querySelectorAll('[data-qty-step]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const min = Number(this.input.min || 1);
          const next = Number(this.input.value) + Number(btn.dataset.qtyStep);
          this.input.value = Math.max(min, next);
          this.input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    }
  }
  customElements.define('quantity-input', QuantityInput);

  /* ------------------------------------------------------------------------
     <sticky-atc> — appears once the real buy button scrolls out of view.
     ---------------------------------------------------------------------- */
  class StickyAtc extends HTMLElement {
    connectedCallback() {
      const anchor = document.querySelector('[data-atc-anchor]');
      if (!anchor || !('IntersectionObserver' in window)) return;
      const io = new IntersectionObserver(([entry]) => {
        this.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
      }, { threshold: 0 });
      io.observe(anchor);
    }
  }
  customElements.define('sticky-atc', StickyAtc);

  /* ------------------------------------------------------------------------
     <announcement-bar> — rotates messages.
     ---------------------------------------------------------------------- */
  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      const slides = Array.from(this.querySelectorAll('.announcement__slide'));
      if (slides.length < 2) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let i = 0;
      const speed = Number(this.dataset.speed || 5) * 1000;
      setInterval(() => {
        slides[i].classList.remove('is-active');
        i = (i + 1) % slides.length;
        slides[i].classList.add('is-active');
      }, speed);
    }
  }
  customElements.define('announcement-bar', AnnouncementBar);

  /* ------------------------------------------------------------------------
     <facet-filters> — filter and sort without a full page load.
     ---------------------------------------------------------------------- */
  class FacetFilters extends HTMLElement {
    connectedCallback() {
      this.addEventListener('change', debounce(() => this.apply(), 150));
      window.addEventListener('popstate', () => this.apply(false));
    }

    async apply(push = true) {
      const form = this.querySelector('form');
      if (!form) return;
      const params = new URLSearchParams(new FormData(form)).toString();
      const grid = document.querySelector('[data-product-grid]');
      if (grid) grid.classList.add('is-loading');
      try {
        const res = await fetch(`${window.location.pathname}?${params}`);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        ['[data-product-grid]', '[data-facet-pills]', '[data-result-count]'].forEach((sel) => {
          const fresh = doc.querySelector(sel);
          const current = document.querySelector(sel);
          if (fresh && current) current.innerHTML = fresh.innerHTML;
        });
        if (push) window.history.pushState({}, '', `${window.location.pathname}?${params}`);
      } catch (_) {
        form.submit();
      } finally {
        if (grid) grid.classList.remove('is-loading');
      }
    }
  }
  customElements.define('facet-filters', FacetFilters);

  /* ------------------------------------------------------------------------
     Header shrink-on-scroll
     ---------------------------------------------------------------------- */
  const header = document.querySelector('.header');
  if (header) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle('is-stuck', window.scrollY > 24);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    const watch = (root) => root.querySelectorAll('.reveal:not(.is-in)').forEach((el) => io.observe(el));
    watch(document);
    /* Re-arm when the theme editor injects a section. */
    document.addEventListener('shopify:section:load', (e) => watch(e.target));
  }

  /* ------------------------------------------------------------------------
     Lookbook hotspots — tap to open on touch devices.
     ---------------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const spot = e.target.closest('.hotspot');
    document.querySelectorAll('.hotspot.is-open').forEach((el) => { if (el !== spot) el.classList.remove('is-open'); });
    if (spot) spot.classList.toggle('is-open');
  });


  /* ------------------------------------------------------------------------
     <site-slideshow>
     ---------------------------------------------------------------------- */
  class SiteSlideshow extends HTMLElement {
    connectedCallback() {
      this.slides = Array.from(this.querySelectorAll('.slideshow__slide'));
      this.dots = Array.from(this.querySelectorAll('[data-slide-to]'));
      if (this.slides.length < 2) return;
      this.index = 0;

      this.querySelector('[data-slide-prev]')?.addEventListener('click', () => this.go(this.index - 1));
      this.querySelector('[data-slide-next]')?.addEventListener('click', () => this.go(this.index + 1));
      this.dots.forEach((d) => d.addEventListener('click', () => this.go(Number(d.dataset.slideTo))));

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (this.dataset.autoplay === 'true' && !reduced) {
        const ms = Number(this.dataset.speed || 6) * 1000;
        this.timer = setInterval(() => this.go(this.index + 1), ms);
        /* Pause while someone is reading or tabbing through it. */
        ['mouseenter', 'focusin'].forEach((e) => this.addEventListener(e, () => this.stop()));
        ['mouseleave', 'focusout'].forEach((e) => this.addEventListener(e, () => this.start(ms)));
      }
    }
    disconnectedCallback() { this.stop(); }
    stop() { clearInterval(this.timer); this.timer = null; }
    start(ms) { if (!this.timer) this.timer = setInterval(() => this.go(this.index + 1), ms); }

    go(next) {
      const n = (next + this.slides.length) % this.slides.length;
      this.slides[this.index].classList.remove('is-active');
      this.slides[n].classList.add('is-active');
      this.dots[this.index]?.setAttribute('aria-current', 'false');
      this.dots[n]?.setAttribute('aria-current', 'true');
      this.index = n;
    }
  }
  customElements.define('site-slideshow', SiteSlideshow);

  /* ------------------------------------------------------------------------
     <video-banner> — external embeds load only when asked, so nothing is
     fetched from YouTube or Vimeo until the visitor clicks play.
     ---------------------------------------------------------------------- */
  class VideoBanner extends HTMLElement {
    connectedCallback() {
      const cover = this.querySelector('[data-video-play]');
      const tpl = this.querySelector('[data-video-embed]');
      if (!cover || !tpl) return;
      cover.addEventListener('click', () => {
        const frame = tpl.content.cloneNode(true);
        cover.replaceWith(frame);
      });
    }
  }
  customElements.define('video-banner', VideoBanner);

  /* ------------------------------------------------------------------------
     <product-recommendations> — Shopify generates the list server-side, so
     the section fetches its own rendered markup.
     ---------------------------------------------------------------------- */
  class ProductRecommendations extends HTMLElement {
    connectedCallback() {
      if (!('IntersectionObserver' in window)) return this.load();
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        this.load();
      }, { rootMargin: '0px 0px 300px 0px' });
      io.observe(this);
    }
    async load() {
      try {
        const res = await fetch(this.dataset.url);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const fresh = doc.querySelector('product-recommendations');
        if (fresh && fresh.innerHTML.trim()) this.innerHTML = fresh.innerHTML;
        else this.closest('section')?.setAttribute('hidden', '');
      } catch (_) {
        this.closest('section')?.setAttribute('hidden', '');
      }
    }
  }
  customElements.define('product-recommendations', ProductRecommendations);

  /* ------------------------------------------------------------------------
     Recently viewed — per-visitor, from localStorage. No app, no account.
     ---------------------------------------------------------------------- */
  const RECENT_KEY = 'gothic:recent';

  function readRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch (_) { return []; }
  }
  function rememberProduct(handle) {
    if (!handle) return;
    try {
      const list = readRecent().filter((h) => h !== handle);
      list.unshift(handle);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 20)));
    } catch (_) { /* private mode — recently viewed simply stays empty */ }
  }

  class RecentlyViewed extends HTMLElement {
    async connectedCallback() {
      const grid = this.querySelector('[data-recent-grid]');
      const limit = Number(this.dataset.limit || 4);
      const here = document.body.dataset.productHandle;
      const handles = readRecent().filter((h) => h !== here).slice(0, limit);
      if (!handles.length || !grid) return;

      const cards = await Promise.all(handles.map(async (h) => {
        try {
          const res = await fetch(`${window.Shopify.routes.root}products/${h}?section_id=recently-viewed-card`);
          if (!res.ok) return null;
          const text = await res.text();
          return text.trim() || null;
        } catch (_) { return null; }
      }));

      const html = cards.filter(Boolean).join('');
      if (!html) return;
      grid.innerHTML = html;
      this.hidden = false;
    }
  }
  customElements.define('recently-viewed', RecentlyViewed);

  /* ------------------------------------------------------------------------
     Popups — newsletter, age gate, cookie notice.
     Each remembers its own dismissal so a visitor is asked once.
     ---------------------------------------------------------------------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };
  const expired = (key) => {
    const until = Number(store.get(key) || 0);
    return !until || Date.now() > until;
  };
  const hideFor = (key, days) => store.set(key, String(Date.now() + days * 864e5));

  function openPopup(el) {
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    const focusable = el.querySelector(FOCUSABLE);
    if (focusable) focusable.focus();
  }
  function closePopup(el) {
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
  }

  /* Age gate runs first and blocks everything else — if the visitor has not
     confirmed, they should not be nagged for their email underneath it. */
  const ageGate = document.getElementById('AgeGate');
  const agePassed = store.get('gothic:age') === 'ok';
  if (ageGate && !agePassed) {
    openPopup(ageGate);
    ageGate.querySelector('[data-age-confirm]')?.addEventListener('click', () => {
      store.set('gothic:age', 'ok');
      closePopup(ageGate);
      startNewsletterTimer();
    });
  }

  const newsletterPopup = document.getElementById('NewsletterPopup');
  function startNewsletterTimer() {
    if (!newsletterPopup) return;
    if (!expired('gothic:newsletter')) return;
    if (store.get('gothic:subscribed') === 'yes') return;
    const delay = Number(newsletterPopup.dataset.delay || 10) * 1000;
    setTimeout(() => {
      if (document.querySelector('.popup.is-open')) return;
      openPopup(newsletterPopup);
    }, delay);
  }
  if (newsletterPopup) {
    const days = Number(newsletterPopup.dataset.dismissDays || 30);
    newsletterPopup.querySelectorAll('[data-popup-close]').forEach((b) =>
      b.addEventListener('click', () => { hideFor('gothic:newsletter', days); closePopup(newsletterPopup); }));
    newsletterPopup.querySelector('form')?.addEventListener('submit', () => {
      store.set('gothic:subscribed', 'yes');
    });
    if (!ageGate || agePassed) startNewsletterTimer();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector('.popup.is-open:not(.popup--age)');
    if (open) { closePopup(open); }
  });

  const cookieBar = document.getElementById('CookieBar');
  if (cookieBar && !store.get('gothic:cookies')) {
    setTimeout(() => cookieBar.classList.add('is-open'), 1200);
    const decide = (answer) => {
      store.set('gothic:cookies', answer);
      cookieBar.classList.remove('is-open');
      /* Hand the answer to Shopify's own consent API when it is present, so
         this is not merely decorative on stores that use it. */
      if (window.Shopify && window.Shopify.customerPrivacy) {
        try {
          window.Shopify.customerPrivacy.setTrackingConsent(answer === 'accept', () => {});
        } catch (_) {}
      }
    };
    cookieBar.querySelector('[data-cookie-accept]')?.addEventListener('click', () => decide('accept'));
    cookieBar.querySelector('[data-cookie-decline]')?.addEventListener('click', () => decide('decline'));
  }

  /* Record the current product for the recently-viewed rail. */
  if (document.body.dataset.productHandle) {
    rememberProduct(document.body.dataset.productHandle);
  }

  /* ------------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    /* Prime the cart so the header bubble is correct on first paint. */
    if (document.querySelector('[data-cart-count]')) refreshCart().catch(() => {});
  });
})();
