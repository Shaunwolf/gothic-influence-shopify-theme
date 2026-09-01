/* ==========================================================================
   GOTHIC INFLUENCE — Lantern cursor glow
   One fixed, pointer-transparent div whose position is eased toward the
   cursor on requestAnimationFrame. Compositor-only work (transform +
   opacity), no layout or paint on the page itself, so it cannot jank
   scrolling. Grows softly over links and buttons. Self-disables on touch
   screens, for prefers-reduced-motion, and when the tab is hidden.
   ========================================================================== */
(function () {
  'use strict';

  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cfg = window.cursorGlowConfig || {};
  var SIZE = cfg.size || 420;
  var STRENGTH = (cfg.strength || 10) / 100;

  var glow = document.createElement('div');
  glow.setAttribute('aria-hidden', 'true');
  glow.style.cssText =
    'position:fixed;top:0;left:0;width:' + SIZE + 'px;height:' + SIZE + 'px;' +
    'margin:-' + (SIZE / 2) + 'px 0 0 -' + (SIZE / 2) + 'px;' +
    'pointer-events:none;z-index:9999;border-radius:50%;' +
    'background:radial-gradient(circle,' +
      'color-mix(in srgb, var(--color-accent, #c6a15b) ' + Math.round(STRENGTH * 100) + '%, transparent) 0%,' +
      'color-mix(in srgb, var(--color-accent, #c6a15b) ' + Math.round(STRENGTH * 55) + '%, transparent) 35%,' +
      'transparent 70%);' +
    'mix-blend-mode:screen;opacity:0;' +
    'transition:opacity 0.4s ease;will-change:transform;';
  document.body.appendChild(glow);

  var tx = innerWidth / 2, ty = innerHeight / 2;
  var x = tx, y = ty;
  var scale = 1, targetScale = 1;
  var visible = false, rafId = null;

  function tick() {
    x += (tx - x) * 0.16;
    y += (ty - y) * 0.16;
    scale += (targetScale - scale) * 0.12;
    glow.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + scale.toFixed(3) + ')';
    if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2 || Math.abs(targetScale - scale) > 0.005) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  function wake() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', function (e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!visible) { visible = true; glow.style.opacity = '1'; }
    targetScale = e.target.closest('a, button, [role="button"], input, .card') ? 1.35 : 1;
    wake();
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    visible = false;
    glow.style.opacity = '0';
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });
})();
