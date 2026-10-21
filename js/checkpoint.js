/*
  Checkpoint question: native form, fieldset, legend, radio buttons or checkboxes.
  Markup without JavaScript: the question, a note that answers need JavaScript,
  and the answer key in a native details element.
  This script adds "Check answer" and "Try again" buttons and one persistent
  role="status" region right after them (WCAG 4.1.3). Feedback is icon plus
  words, selected options are marked in words, and focus is never moved on
  feedback. Nothing is scored or stored.
*/
(function () {
  'use strict';

  const ns = (window.CnxLesson = window.CnxLesson || {});
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const ICONS = {
    correct: 'M5 12.5l4.5 4.5L19 7.5',
    incorrect: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
    error: 'M12 6.5v7M12 17.5v.5'
  };

  function uid(prefix) {
    let id;
    do {
      ns.idCount = (ns.idCount || 0) + 1;
      id = 'cnx-' + prefix + '-' + ns.idCount;
    } while (document.getElementById(id));
    return id;
  }

  function icon(name) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'cnx-check__icon');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', ICONS[name]);
    svg.appendChild(path);
    return svg;
  }

  ns.Checkpoint = function (form) {
    const fieldset = form.querySelector('fieldset');
    const inputs = fieldset ? Array.prototype.slice.call(fieldset.querySelectorAll('input[type="radio"], input[type="checkbox"]')) : [];
    const explain = form.querySelector('.cnx-check__explain');
    const hint = form.getAttribute('data-hint');
    if (!inputs.length || !explain || !hint) {
      throw new Error('checkpoint needs a fieldset with inputs, a .cnx-check__explain and data-hint');
    }
    const multiple = inputs[0].type === 'checkbox';
    const correct = inputs.filter(function (input) {
      return input.hasAttribute('data-correct');
    });
    if (!correct.length) {
      throw new Error('checkpoint needs at least one input with data-correct');
    }

    Array.prototype.forEach.call(form.querySelectorAll('.cnx-check__nojs, .cnx-check__key'), function (el) {
      el.hidden = true;
    });

    const actions = document.createElement('div');
    actions.className = 'cnx-check__actions';

    const check = document.createElement('button');
    check.type = 'submit';
    check.className = 'cnx-btn';
    check.textContent = 'Check answer';

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'cnx-btn cnx-btn--quiet';
    retry.textContent = 'Try again';
    retry.hidden = true;

    actions.appendChild(check);
    actions.appendChild(retry);

    const status = document.createElement('div');
    status.className = 'cnx-check__status';
    status.id = uid('check-status');
    status.setAttribute('role', 'status');

    fieldset.parentNode.insertBefore(actions, fieldset.nextSibling);
    actions.parentNode.insertBefore(status, actions.nextSibling);

    let lastKey = '';

    function clearMarks() {
      inputs.forEach(function (input) {
        const label = input.closest('label');
        const mark = label && label.querySelector('.cnx-check__mark');
        if (mark) {
          mark.parentNode.removeChild(mark);
        }
        if (label) {
          label.removeAttribute('data-mark');
        }
      });
    }

    function clearFeedback() {
      lastKey = '';
      clearMarks();
      status.textContent = '';
      status.removeAttribute('data-state');
      fieldset.removeAttribute('aria-describedby');
    }

    function say(state, lead, detail) {
      status.textContent = '';
      status.setAttribute('data-state', state);
      const line = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = lead;
      line.appendChild(icon(state));
      line.appendChild(strong);
      if (detail) {
        line.appendChild(document.createTextNode(' ' + detail));
      }
      status.appendChild(line);
    }

    function markOption(input, isRight) {
      const label = input.closest('label');
      const mark = document.createElement('span');
      mark.className = 'cnx-check__mark';
      mark.appendChild(icon(isRight ? 'correct' : 'incorrect'));
      mark.appendChild(document.createTextNode(isRight ? 'Correct choice' : 'Incorrect choice'));
      label.setAttribute('data-mark', isRight ? 'correct' : 'incorrect');
      label.appendChild(mark);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const chosen = inputs.filter(function (input) {
        return input.checked;
      });
      const key = chosen.length ? chosen.map(function (input) { return input.value; }).join(',') : 'none';
      // A second press with nothing changed must not repeat the announcement.
      if (key === lastKey) {
        return;
      }
      clearMarks();
      lastKey = key;

      if (!chosen.length) {
        say('error', 'No answer selected.', multiple
          ? 'Select at least one option, then select Check answer.'
          : 'Select an option, then select Check answer.');
        fieldset.setAttribute('aria-describedby', status.id);
        return;
      }
      fieldset.removeAttribute('aria-describedby');

      const rightChosen = chosen.filter(function (input) { return correct.indexOf(input) > -1; });
      const allRight = rightChosen.length === correct.length && chosen.length === correct.length;
      chosen.forEach(function (input) {
        markOption(input, correct.indexOf(input) > -1);
      });

      if (allRight) {
        say('correct', 'Correct.', explain.textContent.trim());
      } else if (multiple) {
        const wrong = chosen.length - rightChosen.length;
        say('incorrect', 'Not quite.', 'You found ' + rightChosen.length + ' of ' + correct.length + ' helpful options' +
          (wrong ? ' and chose ' + wrong + ' that ' + (wrong === 1 ? 'does' : 'do') + ' not help. ' : '. ') + hint);
      } else {
        say('incorrect', 'Not quite.', hint);
      }
      retry.hidden = false;
    });

    inputs.forEach(function (input) {
      input.addEventListener('change', function () {
        if (lastKey) {
          clearFeedback();
          retry.hidden = true;
        }
      });
    });

    retry.addEventListener('click', function () {
      inputs.forEach(function (input) {
        input.checked = false;
      });
      clearFeedback();
      // The button hides itself, so focus goes to the first option, not the page.
      inputs[0].focus();
      retry.hidden = true;
    });
  };
})();
