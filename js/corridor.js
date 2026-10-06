/* Corridor hero: two rails of cards ride from far behind the screen toward the viewer.
   Vanilla port of the React "ImageStreamHero" (same geometry, same defaults).
   Pure CSS 3D: perspective + generated @keyframes. Every length is in `cqw`
   (percent of the container's width), so the shape is resolution-independent. */
(function () {
  'use strict';

  var PATH = {
    perspective: 30,   // strength of the projection; lower = wider-angle rush
    cardWidth: 18,     // card width in world units
    cardHeight: 25,    // card height in world units
    cardRadius: 0.4,   // corner radius
    birthHeight: 2.6,  // on-screen card height at the waist, where a card is born
    exitHeight: 46,    // on-screen card height as a card leaves the frame
    railBirth: -11,    // lateral offset at birth (negative = starts across the axis)
    railExit: 44,      // lateral offset once the rails have finished opening
    fan: 3.3,          // how front-loaded the opening is
    turnBirth: 6,      // Y rotation at birth, degrees
    turnExit: 28,      // Y rotation at exit, degrees
    stops: 24          // keyframe stops used to trace the curve
  };

  /* Sample the path once so the CSS keyframes trace the real curve. */
  function keyframes(dir, name, p) {
    var steps = [];
    for (var s = 0; s <= p.stops; s++) {
      var u = s / p.stops;
      // Geometric in apparent size: consecutive cards keep a constant size
      // ratio, so the ribbon stays solid at both ends.
      var scale = (p.birthHeight / p.cardHeight) * Math.pow(p.exitHeight / p.birthHeight, u);
      var z = p.perspective * (1 - 1 / scale);
      var rail = p.railExit - (p.railExit - p.railBirth) * Math.pow(1 - u, p.fan);
      var turn = p.turnBirth + (p.turnExit - p.turnBirth) * u;
      steps.push(
        (u * 100).toFixed(2) + '%{transform:translate3d(' + (dir * rail).toFixed(2) + 'cqw,0,' +
        z.toFixed(2) + 'cqw) rotateY(' + (-dir * turn).toFixed(2) + 'deg)}'
      );
    }
    return '@keyframes ' + name + '{' + steps.join('') + '}';
  }

  function initCorridor(root) {
    if (!root || !('CSS' in window) || !CSS.supports('width', '1cqw')) { return; } // no container units: hero stays static
    var images = (root.getAttribute('data-images') || '').split(',').filter(Boolean);
    if (!images.length) { return; }

    var cards = parseInt(root.getAttribute('data-cards'), 10) || 9;
    var speed = parseFloat(root.getAttribute('data-speed')) || 18;
    var axis = parseFloat(root.getAttribute('data-axis')) || 55;
    var p = PATH;

    var style = document.createElement('style');
    style.textContent =
      keyframes(1, 'corridor-r', p) + keyframes(-1, 'corridor-l', p) +
      // Pausing (not disabling) keeps the corridor whole: each card is already
      // dropped mid-flight by its negative delay, so it freezes as a finished still.
      '@media(prefers-reduced-motion:reduce){.corridor__card{animation-play-state:paused}}';
    root.appendChild(style);

    var stage = document.createElement('div');
    stage.className = 'corridor__stage';
    stage.style.perspective = p.perspective + 'cqw';
    stage.style.perspectiveOrigin = '50% ' + axis + '%';

    var rails = document.createElement('div');
    rails.className = 'corridor__rails';

    ['corridor-r', 'corridor-l'].forEach(function (name) {
      for (var i = 0; i < cards; i++) {
        var card = document.createElement('div');
        card.className = 'corridor__card';
        card.style.cssText =
          'left:50%;top:' + axis + '%;width:' + p.cardWidth + 'cqw;height:' + p.cardHeight + 'cqw;' +
          'margin-left:' + (-p.cardWidth / 2) + 'cqw;margin-top:' + (-p.cardHeight / 2) + 'cqw;' +
          'border-radius:' + p.cardRadius + 'cqw;' +
          'animation:' + name + ' ' + speed + 's linear infinite;' +
          // Negative delay drops each card mid-flight: the corridor is full on frame one.
          'animation-delay:' + (-(i * speed) / cards) + 's;';
        var img = new Image();
        img.src = images[i % images.length];
        img.alt = '';
        img.width = 600;
        img.height = 800;
        img.decoding = 'async';
        img.draggable = false;
        card.appendChild(img);
        rails.appendChild(card);
      }
    });

    stage.appendChild(rails);
    root.appendChild(stage);
  }

  initCorridor(document.querySelector('[data-corridor]'));
})();
