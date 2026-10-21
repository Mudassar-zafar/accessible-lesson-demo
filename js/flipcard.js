/*
  Flip cards. There is no ARIA pattern for flip cards, so this follows the
  approach in TPGi's "Creating a truly accessible flip card": one real button
  per card, no aria-pressed or aria-expanded, and only one face rendered at a
  time so text reflows when it is resized.
  Markup without JavaScript: both faces visible, labelled "Statement" and "Answer".
  The button name states the action ("Show answer: ..."), changes after each
  turn, and focus stays on it. The face that just appeared sits directly
  before the button in reading order.
*/
(function () {
  'use strict';

  const ns = (window.CnxLesson = window.CnxLesson || {});

  function setSide(card, parts, side) {
    const showBack = side === 'back';
    card.setAttribute('data-side', side);
    parts.front.hidden = showBack;
    parts.back.hidden = !showBack;
    parts.action.textContent = showBack ? 'Show statement' : 'Show answer';
  }

  function enhance(card) {
    const front = card.querySelector('.cnx-flip__face--front');
    const back = card.querySelector('.cnx-flip__face--back');
    const topic = card.getAttribute('data-topic');
    if (!front || !back || !topic) {
      throw new Error('each .cnx-flip needs a front face, a back face and data-topic');
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cnx-btn cnx-btn--quiet cnx-flip__toggle';

    const action = document.createElement('span');
    const hint = document.createElement('span');
    hint.className = 'cnx-vh';
    hint.textContent = ': ' + topic;
    button.appendChild(action);
    button.appendChild(hint);

    const parts = { front: front, back: back, action: action };
    setSide(card, parts, 'front');
    card.appendChild(button);

    button.addEventListener('click', function () {
      card.setAttribute('data-turned', '');
      setSide(card, parts, card.getAttribute('data-side') === 'back' ? 'front' : 'back');
    });
  }

  ns.FlipCards = function (root) {
    const cards = root.querySelectorAll('.cnx-flip');
    if (!cards.length) {
      throw new Error('no .cnx-flip cards found');
    }
    Array.prototype.forEach.call(cards, enhance);
  };
})();
