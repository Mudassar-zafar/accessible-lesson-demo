/*
  Accordion, following the W3C APG Accordion pattern.
  Markup without JavaScript: h3 headings, each followed by its panel, all visible.
  This script puts a native button inside each heading, adds aria-expanded and
  aria-controls, and hides closed panels with the hidden attribute.
  Enter and Space come from the native button, so there is no key handler.
  Panels have no role="region": several can be open at once and APG advises
  against adding that many landmarks.
*/
(function () {
  'use strict';

  const ns = (window.CnxLesson = window.CnxLesson || {});
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function uid(prefix) {
    let id;
    do {
      ns.idCount = (ns.idCount || 0) + 1;
      id = 'cnx-' + prefix + '-' + ns.idCount;
    } while (document.getElementById(id));
    return id;
  }

  function makeIcon() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'cnx-accordion__icon');
    const across = document.createElementNS(SVG_NS, 'path');
    across.setAttribute('d', 'M6 12h12');
    const down = document.createElementNS(SVG_NS, 'path');
    down.setAttribute('d', 'M12 6v12');
    down.setAttribute('class', 'cnx-accordion__icon-down');
    svg.appendChild(across);
    svg.appendChild(down);
    return svg;
  }

  function setOpen(button, panel, open) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
  }

  ns.Accordion = function (root) {
    const headings = Array.prototype.filter.call(root.children, function (child) {
      return child.classList.contains('cnx-accordion__heading');
    });
    if (!headings.length) {
      throw new Error('no .cnx-accordion__heading found');
    }

    const pairs = headings.map(function (heading) {
      const panel = heading.nextElementSibling;
      if (!panel || !panel.classList.contains('cnx-accordion__panel')) {
        throw new Error('each heading needs a .cnx-accordion__panel after it');
      }
      return { heading: heading, panel: panel };
    });

    pairs.forEach(function (pair) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cnx-accordion__trigger';
      button.id = uid('acc-btn');

      const label = document.createElement('span');
      label.className = 'cnx-accordion__label';
      while (pair.heading.firstChild) {
        label.appendChild(pair.heading.firstChild);
      }
      button.appendChild(label);
      button.appendChild(makeIcon());

      if (!pair.panel.id) {
        pair.panel.id = uid('acc-panel');
      }
      button.setAttribute('aria-controls', pair.panel.id);
      setOpen(button, pair.panel, pair.heading.hasAttribute('data-open'));
      pair.heading.appendChild(button);

      button.addEventListener('click', function () {
        setOpen(button, pair.panel, button.getAttribute('aria-expanded') !== 'true');
      });
    });
  };
})();
