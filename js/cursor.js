/* Custom cursor: the mascot follows the pointer (fine pointers only).
   Independent of GSAP/Lenis: if this fails, the native cursor stays. */
(function () {
  'use strict';
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) { return; }

  var el = document.createElement('img');
  el.className = 'cursor';
  el.src = 'assets/img/brand/face.png';
  el.alt = '';
  el.width = 46;
  el.height = 46;
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  document.documentElement.classList.add('has-cursor');

  var tx = 0, ty = 0, x = 0, y = 0, started = false;

  window.addEventListener('mousemove', function (e) {
    tx = e.clientX; ty = e.clientY;
    if (!started) { x = tx; y = ty; started = true; }
    el.classList.add('is-on');
    el.classList.toggle('is-hover', !!e.target.closest('a, button, .pill, [tabindex]'));
  }, { passive: true });
  document.addEventListener('mouseleave', function () { el.classList.remove('is-on'); });
  document.addEventListener('mouseenter', function () { el.classList.add('is-on'); });

  (function loop() {
    x += (tx - x) * 0.28;
    y += (ty - y) * 0.28;
    el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    requestAnimationFrame(loop);
  })();
})();
