# Accessible lesson components

A sample eLearning lesson page ("Leading Better Conversations", module 3, page 2 of 6) and the small HTML, CSS and JavaScript component library behind it: accordion, tabs, flip cards, carousel and checkpoint questions. Built to WCAG 2.1 AA, to the W3C ARIA Authoring Practices patterns where one exists, and to survive the constraints of a learning management system.

- Plain HTML5, CSS and vanilla JavaScript (ES2017). No framework, no build step, no CDN, no requests at runtime.
- Works opened straight from the file system or from any static host, from any folder depth.
- Every component is readable and honest without JavaScript: all content shows and there are no buttons that do nothing.

Open `index.html` in a browser to see it. Accessibility decisions and the test matrix are in [ACCESSIBILITY.md](ACCESSIBILITY.md). Steps for a manual screen reader check are in [MANUAL-SCREEN-READER-CHECKLIST.md](MANUAL-SCREEN-READER-CHECKLIST.md). Screenshots of key states are in [screenshots/](screenshots/).

## Files

| Path | What it is |
|---|---|
| `index.html` | The lesson page |
| `page-1.html`, `page-3.html` | Stub pages so Previous and Next are real links |
| `css/lesson.css` | All styles, every selector scoped under `.cnx-lesson` |
| `js/accordion.js`, `js/tabs.js`, `js/flipcard.js`, `js/carousel.js`, `js/checkpoint.js` | One self-contained file per component |
| `js/init.js` | Starts each component on its own, inside its own try/catch |
| `assets/fonts/` | Atkinson Hyperlegible (woff2) and its SIL Open Font License |
| `assets/img/` | Decorative SVG drawings made for this page |
| `test/` | Playwright specs, fixtures, mutation-proof and screenshot scripts |
| `test/fixtures/stress.html` | Two copies of every component, the second with tripled text |
| `test/fixtures/lms-hostile.css` | An LMS-style theme loaded after ours, used by the tests |

## Using a component

Write the static markup, mark the root with `data-cnx="<name>"`, and load the component script before `init.js`. The script adds the interactive behaviour and the ARIA that belongs with it. A root that starts successfully gets `data-cnx-ready`.

```html
<div class="cnx-accordion" data-cnx="accordion">
  <h3 class="cnx-accordion__heading">Context: name the moment</h3>
  <div class="cnx-accordion__panel">
    <p>Panel content.</p>
  </div>
</div>
<script src="js/accordion.js"></script>
<script src="js/init.js"></script>
```

| Component | Root | Required inside |
|---|---|---|
| Accordion | `data-cnx="accordion"` | `.cnx-accordion__heading` followed by `.cnx-accordion__panel`, repeated |
| Tabs | `data-cnx="tabs" data-label="..."` | `.cnx-tabs__panel` blocks, each with an `.cnx-tabs__title` heading |
| Flip cards | `data-cnx="flipcards"` | `.cnx-flip` items with `data-topic`, a front and a back face |
| Carousel | `data-cnx="carousel" data-label="..."` on a `section` | `ol.cnx-carousel__slides` of `.cnx-carousel__slide` |
| Checkpoint | `data-cnx="checkpoint" data-hint="..."` on a `form` | `fieldset` and `legend`, inputs with `data-correct` on right answers, `.cnx-check__explain` |

IDs are generated, so any number of instances can share a page (proved by `stress.html`). If a component throws while starting, `init.js` puts its original markup back, logs `[cnx] <name> did not start` to the console, and the other components carry on.

## Using these components in Brightspace

These notes describe how the library is meant to fit an HTML topic in D2L Brightspace. They are based on Brightspace's documented behaviour, not on a delivered Brightspace project, and should be checked against the course's own setup.

- Upload `css/`, `js/` and `assets/` to the course files, then link them from the HTML topic with relative paths (for example `<link rel="stylesheet" href="../css/lesson.css">`). Everything uses relative paths, so the folder can sit at any depth.
- Brightspace's rich text editor can strip `<script>` elements, inline styles and CSS custom properties, depending on organisation settings. If scripts are stripped, every component falls back to its static markup: headings and panels, all three tab examples, both sides of each card, all four scenarios, and the questions with a native answer key. Nothing is lost and nothing is broken.
- If custom properties are stripped from inline styles, keep the styles in the linked `lesson.css` file rather than pasting them into the editor.
- Avoid renaming or moving files after linking them: the links in existing topics will break.
- Content inside closed accordion panels, inactive tabs and hidden slides is still in the page, so heavy media in them still downloads. Keep large video out of hidden panels, or load it on demand.
- Brightspace shows HTML topics inside its own frame and theme. All selectors here are scoped under `.cnx-lesson`, so they neither leak out nor lose to the platform's element rules (see below).

## LMS constraint hardening

- Every selector is scoped under `.cnx-lesson`. There are no element selectors at the global level, and `body` and `html` are never styled.
- A scoped reset (`.cnx-lesson *`) neutralises the usual theme rules on `*`, headings, paragraphs, lists, buttons, inputs, labels, fieldsets, images and tables. Scoped class selectors outrank plain element selectors whatever the load order.
- The only `!important` is `.cnx-lesson [hidden] { display: none !important; }`, because some themes override the `hidden` attribute and would show closed panels and hidden slides.
- `test/fixtures/lms-hostile.css` imitates a theme injected after ours (resets, serif fonts, uppercase headings, outset buttons, floated list items, `outline: none` on focus). The tests load it last and check that computed styles, hidden states, focus rings and layout survive. See `screenshots/lms-hostile-stylesheet.png`.
- Font sizes use `rem` so learners' browser text size settings apply. A theme that changes the root font size (`html { font-size: ... }`) will scale this page too; that is a known trade-off.
- If the font files are missing, the stack falls back to Segoe UI, system-ui and Arial. A test removes the font folder and checks the page still reads at 18px with no overflow.

## Running the tests

Requires Node LTS. The tooling is development only and is not shipped with the page.

```bash
npm install
npx playwright install chromium firefox webkit
npm test
```

- `npm test` runs every spec in Chromium, Firefox and WebKit. html-validate and forced-colours checks run in Chromium only.
- `npm run validate` runs html-validate on all four HTML files.
- `node test/mutation-proof.js` breaks one behaviour at a time and checks that a test fails each time.
- `node test/screenshots.js` regenerates the screenshots.
- `node test/fixtures/build-stress.js` rebuilds `stress.html` after `index.html` changes.

Notes from the test machine (Windows 11):

- The WebKit build for Windows stalls when several pages run at once, so the WebKit project runs with one worker.
- Firefox crashed once with four parallel workers (Windows error 0xC0000409), so the Firefox project runs with two.
- WebKit leaves links out of the Tab order unless the "Press Tab to highlight each item" setting is on. The Tab order test accepts that platform difference and checks the rest of the order.
- If Playwright's Firefox fails to start on Windows with a "side-by-side configuration" error, reinstalling the browsers into a fresh folder set by `PLAYWRIGHT_BROWSERS_PATH` fixed it.

## How I work in Git on a small team

- One branch per module, component or fix (`feat/carousel`, `fix/accordion-icon-origin`), cut from an up-to-date `main`.
- Small commits that each do one thing, with a message that says what changed and why.
- A pull request for every branch, with before and after screenshots and the accessibility checklist: keyboard walk-through, axe result, no-JavaScript check, zoom and text spacing, screen reader notes.
- Review before merge, by another developer where possible, and merge with a merge commit so the history shows what each branch delivered.
- Never commit straight to `main`.

The history of this repository follows the same pattern: each feature and fix was built on its own branch and merged with `git merge --no-ff`.

## Licence

Code: MIT, see [LICENSE](LICENSE). Font: Atkinson Hyperlegible, SIL Open Font License 1.1, see [assets/fonts/OFL.txt](assets/fonts/OFL.txt). Illustrations were drawn for this sample.
