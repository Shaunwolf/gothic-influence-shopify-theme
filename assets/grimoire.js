/* ==========================================================================
   GOTHIC INFLUENCE — The Grimoire (wishlist)
   Saved handles live in localStorage (key gi:grimoire) — per-browser, no
   account needed. Heart toggles are delegated document-wide so cards from
   re-rendered sections keep working; the drawer fetches /products/<handle>.js
   on open and renders client-side. Every storage access is wrapped: private
   windows and blocked site data must degrade to "nothing saved", never throw.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'gi:grimoire';

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* quota/private */ }
  }

  function has(handle) { return read().indexOf(handle) !== -1; }

  function toggle(handle) {
    var list = read();
    var i = list.indexOf(handle);
    if (i === -1) list.unshift(handle); else list.splice(i, 1);
    write(list);
    sync();
    return i === -1;
  }

  /* Reflect saved state onto every visible heart and the header count. */
  function sync() {
    var list = read();
    document.querySelectorAll('[data-grimoire-toggle]').forEach(function (btn) {
      var saved = list.indexOf(btn.dataset.handle) !== -1;
      btn.classList.toggle('is-saved', saved);
      btn.setAttribute('aria-pressed', String(saved));
    });
    document.querySelectorAll('[data-grimoire-count]').forEach(function (el) {
      el.textContent = list.length;
      el.hidden = list.length === 0;
    });
  }

  function money(cents, currency) {
    try {
      return new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency', currency: currency
      }).format(cents / 100);
    } catch (e) { return (cents / 100).toFixed(2); }
  }

  function esc(text) {
    var div = document.createElement('div');
    div.textContent = text == null ? '' : text;
    return div.innerHTML;
  }

  function renderDrawer() {
    var body = document.querySelector('[data-grimoire-list]');
    if (!body) return;
    var drawer = body.closest('grimoire-drawer');
    var currency = (drawer && drawer.dataset.currency) || 'USD';
    var strings = window.grimoireStrings || {};
    var list = read();

    if (!list.length) {
      body.innerHTML =
        '<div class="empty-state" data-grimoire-empty>' +
          '<p>' + esc(strings.empty || 'Nothing saved yet.') + '</p>' +
          '<p class="grimoire__hint">' + esc(strings.emptyHint || '') + '</p>' +
        '</div>';
      return;
    }

    body.innerHTML = '<p class="grimoire__hint">' + esc(strings.loading || 'Consulting the pages…') + '</p>';

    Promise.allSettled(list.map(function (handle) {
      return fetch('/products/' + handle + '.js').then(function (r) {
        if (!r.ok) throw new Error(handle);
        return r.json();
      });
    })).then(function (results) {
      var rows = results.map(function (res, i) {
        if (res.status !== 'fulfilled') {
          /* Product removed from the store: drop it quietly. */
          var stale = read().filter(function (h) { return h !== list[i]; });
          write(stale);
          return '';
        }
        var p = res.value;
        var img = p.featured_image
          ? '<img class="grimoire-item__img" src="' + esc(p.featured_image) + '&width=160" alt="" loading="lazy">'
          : '';
        var buy = '';
        if (p.available && p.variants.length === 1 && typeof window.addToCart === 'function') {
          buy = '<button type="button" class="btn btn--gold btn--sm" data-grimoire-add data-variant-id="' + p.variants[0].id + '">' +
            esc(strings.addToCart || 'Add to cart') + '</button>';
        } else if (!p.available) {
          buy = '<span class="grimoire-item__sold-out">' + esc(strings.soldOut || 'Sold out') + '</span>';
        }
        return (
          '<div class="grimoire-item" data-handle="' + esc(p.handle) + '">' + img +
            '<div class="grimoire-item__info">' +
              '<a class="grimoire-item__title" href="' + esc(p.url) + '">' + esc(p.title) + '</a>' +
              '<span class="grimoire-item__price">' + money(p.price, currency) + '</span>' +
            '</div>' +
            '<div class="grimoire-item__actions">' + buy +
              '<button type="button" class="grimoire-item__remove" data-grimoire-remove data-handle="' + esc(p.handle) + '">' +
                esc(strings.remove || 'Remove') + '</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      body.innerHTML = rows || '<div class="empty-state"><p>' + esc(strings.empty || 'Nothing saved yet.') + '</p></div>';
      sync();
    });
  }

  document.addEventListener('click', function (e) {
    var toggleBtn = e.target.closest('[data-grimoire-toggle]');
    if (toggleBtn) {
      e.preventDefault();
      e.stopPropagation();
      toggle(toggleBtn.dataset.handle);
      return;
    }

    var removeBtn = e.target.closest('[data-grimoire-remove]');
    if (removeBtn) {
      toggle(removeBtn.dataset.handle);
      renderDrawer();
      return;
    }

    var addBtn = e.target.closest('[data-grimoire-add]');
    if (addBtn && typeof window.addToCart === 'function') {
      addBtn.disabled = true;
      window.addToCart([{ id: Number(addBtn.dataset.variantId), quantity: 1 }], addBtn)
        .catch(function () { /* toast handled by theme.js */ })
        .finally(function () { addBtn.disabled = false; });
      return;
    }

    var opener = e.target.closest('[data-drawer-open="GrimoireDrawer"]');
    if (opener) renderDrawer();
  });

  /* Re-sync hearts when the theme editor re-renders a section. */
  document.addEventListener('shopify:section:load', sync);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sync);
  } else {
    sync();
  }
})();
