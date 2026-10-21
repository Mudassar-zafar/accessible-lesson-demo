/*
  Mutation proof: breaks one key behaviour at a time, runs the matching specs
  on Chromium, and checks that at least one test fails. The file is always
  restored afterwards. Run: node test/mutation-proof.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');

const mutations = [
  { name: 'Accordion stops updating aria-expanded', file: 'js/accordion.js', spec: 'test/accordion.spec.js',
    find: "button.setAttribute('aria-expanded', open ? 'true' : 'false');", replace: '' },
  { name: 'Accordion adds a duplicate Enter handler (double toggle)', file: 'js/accordion.js', spec: 'test/accordion.spec.js',
    find: "      button.addEventListener('click', function () {",
    replace: "      button.addEventListener('keydown', function (e) { if (e.key === 'Enter') { setOpen(button, pair.panel, button.getAttribute('aria-expanded') !== 'true'); } });\n      button.addEventListener('click', function () {" },
  { name: 'Tabs break the roving tabindex', file: 'js/tabs.js', spec: 'test/tabs.spec.js',
    find: "tab.setAttribute('tabindex', selected ? '0' : '-1');", replace: "tab.setAttribute('tabindex', '0');" },
  { name: 'Tabs stop wrapping at the ends', file: 'js/tabs.js', spec: 'test/tabs.spec.js',
    find: 'current = (index + tabs.length) % tabs.length;', replace: 'current = Math.max(0, Math.min(index, tabs.length - 1));' },
  { name: 'Flip card leaves the back face rendered', file: 'js/flipcard.js', spec: 'test/flipcards.spec.js',
    find: 'parts.back.hidden = !showBack;', replace: 'parts.back.hidden = false;' },
  { name: 'Flip card stops updating the button name', file: 'js/flipcard.js', spec: 'test/flipcards.spec.js',
    find: "parts.button.setAttribute('aria-label', action + ': ' + parts.topic);", replace: "if (!parts.button.hasAttribute('aria-label')) { parts.button.setAttribute('aria-label', action + ': ' + parts.topic); }" },
  { name: 'Carousel no longer stops rotation on keyboard focus', file: 'js/carousel.js', spec: 'test/carousel.spec.js',
    find: "root.addEventListener('focusin',", replace: "root.addEventListener('focusin-disabled'," },
  { name: 'Carousel no longer stops rotation on hover', file: 'js/carousel.js', spec: 'test/carousel.spec.js',
    find: "root.addEventListener('mouseover',", replace: "root.addEventListener('mouseover-disabled'," },
  { name: 'Carousel keeps aria-live polite while rotating', file: 'js/carousel.js', spec: 'test/carousel.spec.js',
    find: "viewport.setAttribute('aria-live', 'off');", replace: "viewport.setAttribute('aria-live', 'polite');" },
  { name: 'Carousel leaves non-current slides rendered', file: 'js/carousel.js', spec: 'test/carousel.spec.js',
    find: 'slide.hidden = i !== current;', replace: 'slide.hidden = false;' },
  { name: 'Checkpoint stops writing to the status region', file: 'js/checkpoint.js', spec: 'test/checkpoint.spec.js',
    find: 'status.appendChild(line);', replace: '' },
  { name: 'Checkpoint loses the double-press guard', file: 'js/checkpoint.js', spec: 'test/checkpoint.spec.js',
    find: 'if (key === lastKey) {\n        return;\n      }', replace: '' },
  { name: 'Checkpoint error no longer linked with aria-describedby', file: 'js/checkpoint.js', spec: 'test/checkpoint.spec.js',
    find: "fieldset.setAttribute('aria-describedby', status.id);", replace: '' },
  { name: 'Try again hides itself without moving focus', file: 'js/checkpoint.js', spec: 'test/checkpoint.spec.js',
    find: 'inputs[0].focus();', replace: '' },
  { name: 'init.js no longer restores markup when a component throws', file: 'js/init.js', spec: 'test/resilience.spec.js',
    find: 'el.parentNode.replaceChild(original, el);', replace: '' },
  { name: 'A transition outside the reduced-motion query', file: 'css/lesson.css', spec: 'test/display.spec.js',
    find: '/* MOTION: every transition', replace: '.cnx-lesson .cnx-btn { transition: color 0.3s ease; }\n\n/* MOTION: every transition' },
  { name: 'Focus outline removed', file: 'css/lesson.css', spec: 'test/keyboard.spec.js',
    find: 'outline: 3px solid var(--cnx-focus);', replace: 'outline: none;' },
  { name: 'Scoped reset loses box-sizing (LMS stylesheet wins)', file: 'css/lesson.css', spec: 'test/resilience.spec.js',
    find: '.cnx-lesson *::after {\n  box-sizing: border-box;\n}', replace: '.cnx-lesson *::after {\n}' }
];

const results = [];
for (const m of mutations) {
  const file = path.join(root, m.file);
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(m.find)) {
    results.push({ name: m.name, outcome: 'NOT APPLIED (pattern not found)' });
    continue;
  }
  try {
    fs.writeFileSync(file, original.replace(m.find, m.replace));
    const run = spawnSync('npx playwright test --project=chromium --reporter=line ' + m.spec,
      { cwd: root, encoding: 'utf8', shell: true });
    const failed = (run.stdout.match(/(\d+) failed/) || [0, 0])[1];
    results.push({ name: m.name, spec: m.spec, outcome: run.status !== 0 ? 'caught' : 'NOT CAUGHT', failedTests: Number(failed) });
  } finally {
    fs.writeFileSync(file, original);
  }
  console.log(results[results.length - 1]);
}

const missed = results.filter(function (r) { return r.outcome !== 'caught'; });
console.log('\n' + (results.length - missed.length) + ' of ' + results.length + ' mutations caught.');
process.exitCode = missed.length ? 1 : 0;
