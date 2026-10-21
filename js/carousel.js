/*
  Carousel, following the W3C APG Carousel pattern (basic, with buttons).
  Markup without JavaScript: every slide visible as an ordered list.
  This script adds the carousel name and role description, previous and next
  buttons, a "Slide N of 4" line and a rotation button. Slides that are not
  current use the hidden attribute, so their content is out of the Tab order.

  Rotation is off by default. When the learner starts it, slides change every
  6 seconds and the slides wrapper switches to aria-live="off". Rotation stops,
  and only restarts when the learner presses Start again, when:
  - keyboard focus enters or moves inside the carousel, or
  - the pointer is over any part of the carousel other than the rotation
    button, so a pointer user can still reach and press Stop.
*/
(function () {
  'use strict';

  const ns = (window.CnxLesson = window.CnxLesson || {});
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const INTERVAL = 6000;

  function uid(prefix) {
    let id;
    do {
      ns.idCount = (ns.idCount || 0) + 1;
      id = 'cnx-' + prefix + '-' + ns.idCount;
    } while (document.getElementById(id));
    return id;
  }

  function icon(paths) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    paths.forEach(function (d) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    return svg;
  }

  const ICONS = {
    play: ['M8 5.5v13l10.5-6.5z'],
    pause: ['M7.5 5.5h3v13h-3z', 'M13.5 5.5h3v13h-3z'],
    prev: ['M14.5 6l-6 6 6 6'],
    next: ['M9.5 6l6 6-6 6']
  };

  function makeButton(className, iconName, text) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cnx-btn cnx-btn--quiet ' + className;
    const label = document.createElement('span');
    label.textContent = text;
    button.appendChild(icon(ICONS[iconName]));
    button.appendChild(label);
    return { button: button, label: label };
  }

  ns.Carousel = function (root) {
    const list = root.querySelector('.cnx-carousel__slides');
    const label = root.getAttribute('data-label');
    if (!list || !label) {
      throw new Error('carousel needs .cnx-carousel__slides and data-label');
    }
    const slides = Array.prototype.filter.call(list.children, function (child) {
      return child.classList.contains('cnx-carousel__slide');
    });
    if (slides.length < 2) {
      throw new Error('carousel needs at least two slides');
    }

    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', label);

    const controls = document.createElement('div');
    controls.className = 'cnx-carousel__controls';

    const rotate = makeButton('cnx-carousel__rotate', 'play', 'Start slide rotation');
    const prev = makeButton('cnx-carousel__prev', 'prev', 'Previous slide');
    const next = makeButton('cnx-carousel__next', 'next', 'Next slide');

    const position = document.createElement('p');
    position.className = 'cnx-carousel__position';

    const nav = document.createElement('div');
    nav.className = 'cnx-carousel__nav';
    nav.appendChild(prev.button);
    nav.appendChild(position);
    nav.appendChild(next.button);

    controls.appendChild(rotate.button);
    controls.appendChild(nav);

    const viewport = document.createElement('div');
    viewport.className = 'cnx-carousel__viewport';
    viewport.id = uid('carousel-slides');
    viewport.setAttribute('aria-live', 'polite');

    // The list becomes a set of slide groups, so its list semantics go.
    list.setAttribute('role', 'none');
    slides.forEach(function (slide, i) {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', i + 1 + ' of ' + slides.length);
    });

    root.insertBefore(controls, list);
    root.insertBefore(viewport, list);
    viewport.appendChild(list);

    let current = 0;
    let timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.hidden = i !== current;
      });
      position.textContent = 'Slide ' + (current + 1) + ' of ' + slides.length;
    }

    function setRotateButton(playing) {
      rotate.label.textContent = playing ? 'Stop slide rotation' : 'Start slide rotation';
      rotate.button.replaceChild(icon(playing ? ICONS.pause : ICONS.play), rotate.button.firstChild);
    }

    function startRotation() {
      if (timer) {
        return;
      }
      viewport.setAttribute('aria-live', 'off');
      setRotateButton(true);
      timer = window.setInterval(function () {
        show(current + 1);
      }, INTERVAL);
    }

    function stopRotation() {
      if (!timer) {
        return;
      }
      window.clearInterval(timer);
      timer = null;
      viewport.setAttribute('aria-live', 'polite');
      setRotateButton(false);
    }

    // A mouse press focuses the button before its click. That focus must not
    // count as "focus entered the carousel", or Stop would restart rotation.
    let pressingRotate = false;
    rotate.button.addEventListener('mousedown', function () {
      pressingRotate = true;
    });
    rotate.button.addEventListener('focusout', function () {
      pressingRotate = false;
    });

    rotate.button.addEventListener('click', function () {
      pressingRotate = false;
      if (timer) {
        stopRotation();
      } else {
        startRotation();
      }
    });
    prev.button.addEventListener('click', function () {
      show(current - 1);
    });
    next.button.addEventListener('click', function () {
      show(current + 1);
    });

    root.addEventListener('focusin', function (event) {
      if (!(pressingRotate && event.target === rotate.button)) {
        stopRotation();
      }
    });
    // mouseover also fires when the pointer first enters, so it covers hover.
    root.addEventListener('mouseover', function (event) {
      if (!rotate.button.contains(event.target)) {
        stopRotation();
      }
    });

    root.classList.add('cnx-carousel--enhanced');
    show(0);
  };
})();
