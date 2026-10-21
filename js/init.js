/*
  Starts every component on the page, each on its own.
  If one component throws, its original markup is put back (readable,
  no dead controls) and the others still start.
*/
(function () {
  'use strict';

  const ns = (window.CnxLesson = window.CnxLesson || {});

  const components = [
    { name: 'accordion', ctor: 'Accordion' },
    { name: 'tabs', ctor: 'Tabs' },
    { name: 'flipcards', ctor: 'FlipCards' },
    { name: 'carousel', ctor: 'Carousel' },
    { name: 'checkpoint', ctor: 'Checkpoint' }
  ];

  function startOne(component, el) {
    if (el.hasAttribute('data-cnx-ready')) {
      return;
    }
    const original = el.cloneNode(true);
    try {
      if (typeof ns[component.ctor] !== 'function') {
        throw new Error('component script is missing');
      }
      ns[component.ctor](el);
      el.setAttribute('data-cnx-ready', '');
    } catch (err) {
      if (el.parentNode) {
        el.parentNode.replaceChild(original, el);
      }
      console.error('[cnx] ' + component.name + ' did not start, showing static content.', err);
    }
  }

  function start() {
    components.forEach(function (component) {
      const nodes = document.querySelectorAll('[data-cnx="' + component.name + '"]');
      Array.prototype.forEach.call(nodes, function (el) {
        startOne(component, el);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
