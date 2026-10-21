# Accessibility notes

Target: WCAG 2.1 level AA. Approach: native HTML first, ARIA only where HTML has no equivalent, behaviour added by JavaScript on top of content that already works without it.

## Test status

| Check | Status |
|---|---|
| Automated: axe-core (WCAG 2.1 A and AA tags) in every state, html-validate, Playwright in Chromium, Firefox and WebKit | Automated: passed |
| Keyboard: scripted Tab order, every component operated by keyboard alone, no trap, focus never dropped | Keyboard (scripted): passed |
| Screen reader on Windows | NVDA + Firefox: passed (manual test, 2026-10-21) |
| Screen reader on macOS | VoiceOver + Safari: pending manual test |

NVDA with Firefox was checked by hand on 2026-10-21 using [MANUAL-SCREEN-READER-CHECKLIST.md](MANUAL-SCREEN-READER-CHECKLIST.md). VoiceOver with Safari has not been run yet.

## Page

- `lang="en"`, a descriptive `title`, a skip link to `main`, and `header`, `nav` (breadcrumb), `main`, `nav` (lesson pages) and `footer` landmarks. The two `nav` elements have distinct names.
- One `h1`, then `h2` per section and `h3` inside sections, with no skipped levels.
- Content sections are plain `section` elements without accessible names, so they do not each become a region landmark.
- Progress is the text "Page 2 of 6". The bar beside it is `aria-hidden` decoration.
- Previous and Next are real links to real pages. There is no `href="#"` anywhere.
- `main` has `tabindex="-1"` so the skip link moves focus reliably in every browser. It shows no focus ring because it is not a control.

## Components

### Accordion

Pattern: W3C APG Accordion.

- Each header is an `h3` containing a native `button` with `aria-expanded` and `aria-controls` pointing at its panel. Closed panels use the `hidden` attribute.
- Enter and Space come from the native button. There are no key handlers, so there is no double-toggle risk.
- No `role="region"` on panels. Four panels can be open at once, and APG advises against regions where that would create many landmarks.
- The optional Up, Down, Home and End keys between headers are not added. Tab moves between headers.
- Without JavaScript: the headings are plain `h3` text and every panel is visible.

### Tabs

Pattern: W3C APG Tabs with automatic activation (content is already in the page).

- `role="tablist"` with `aria-label`; `role="tab"` buttons with `aria-selected` and `aria-controls`; `role="tabpanel"` with `aria-labelledby` and `tabindex="0"`.
- Roving tabindex: only the selected tab is in the Tab order. Left and Right move and wrap, Home and End jump. Selection follows focus.
- The static `h3` in each panel is hidden once the tabs exist, because the tab now names the panel.
- Without JavaScript: three blocks, each with its own `h3`, all visible, no tab roles.

### Flip cards

Approach: TPGi, "Creating a truly accessible flip card". There is no ARIA pattern for flip cards.

- One native button per card. Its accessible name states the action and the card, for example "Show answer: feedback works best soon after the event", then "Show statement: ..." once turned. The name starts with the visible text "Show answer" (WCAG 2.5.3) and is set with `aria-label` so the three buttons are told apart.
- No `aria-pressed`: the button does not switch a setting on and off, it swaps which content is shown, and its name already says what will happen. A pressed state would announce "Show answer, toggle button, pressed", which describes the button rather than the card.
- No `aria-expanded`: nothing is expanded or collapsed. One face replaces the other.
- Only one face is rendered at a time; the other is `hidden` (display none), not just rotated away. Text therefore reflows at any size and the hidden face is not read.
- After turning, focus stays on the button. The new state is perceivable two ways: the button's name changes, and the face that just appeared sits directly before the button, so reading back by one item reaches it. No live region is used, so nothing is announced twice. Whether NVDA and VoiceOver announce the name change on the focused button is one of the manual checks.
- The turn animation runs only with `prefers-reduced-motion: no-preference`, and only after a learner has turned a card.
- Without JavaScript: both faces show, stacked, labelled "Statement" and "Answer".

### Carousel

Pattern: W3C APG Carousel (basic, with previous and next buttons).

- The container is a `section` with `aria-roledescription="carousel"` and the name "Real-world scenarios". Each slide is `role="group"` with `aria-roledescription="slide"` and `aria-label="N of 4"`. The list that holds the slides gets `role="none"` once the slides become groups.
- Non-current slides use `hidden`, so their content is out of the Tab order and the accessibility tree.
- Previous and Next buttons plus a visible "Slide N of 4". No swipe gestures, so nothing needs a path-based or multipoint gesture (WCAG 2.5.1).
- Rotation is off by default. The rotation button's label switches between "Start slide rotation" and "Stop slide rotation". It has no `aria-pressed`, for the same reason as the flip cards and because APG uses a changing label for this control.
- While rotating: a slide every 6 seconds, `aria-live="off"` on the slides wrapper. Otherwise `aria-live="polite"`, so a slide is announced when the learner changes it.
- Rotation stops, and stays stopped until the learner presses Start again, when keyboard focus enters or moves inside the carousel, or when the pointer is over any part of it other than the rotation button. The rotation button is excluded so a pointer user can reach and press Stop.
- Decorative illustrations use `alt=""`. The scenario text carries the meaning.
- Without JavaScript: all four scenarios show as an ordered list, with no controls.

### Checkpoint questions

Native forms and WCAG 4.1.3 Status Messages.

- `form` > `fieldset` > `legend`, native radio buttons (question 1) and checkboxes (question 2), each wrapped in its visible `label`.
- "Check answer" is the form's submit button, so Enter in an option also checks.
- One persistent `role="status"` region directly after the buttons. It exists from page load, empty, so the first message is announced.
- Nothing selected: the error is written to that same status region (announced once) and the fieldset gets `aria-describedby` pointing at it. Focus stays on the button. No alert dialogs.
- Feedback: icon plus words ("Correct.", "Not quite.") and a one-line explanation or hint. Each chosen option is marked in words ("Correct choice", "Incorrect choice") inside its label, so the marking is part of the option's name. Colour is never the only signal.
- Focus is not moved on feedback. "Try again" clears selections and feedback, then hides itself, so it moves focus to the first option rather than letting focus fall to the page.
- Pressing "Check answer" again without changing anything changes nothing, so there are no duplicate announcements or markup.
- Formative only: no scores, no storage, no SCORM or xAPI.
- Without JavaScript: the questions, the note "Answers appear when JavaScript is enabled", and the answer key in a native `details` element. html-validate's rule that a form needs a submit button is disabled for these two forms with an inline reason, because the button is added by script so it never exists as a dead control.

## Shared behaviour

- Every control is a native `button`, `a`, `input` or `summary`. No `role="button"`, no `tabindex` above 0.
- Focus ring: 3px solid outline, 2px offset. Ink #17324D on light backgrounds (13.13:1 on white, 11.74:1 on the panel colour) and marigold #F2B33D inside dark areas (7.06:1). Tested at every Tab stop for at least 2px and at least 3:1. In forced colours the ring uses `Highlight`.
- Motion only inside `@media (prefers-reduced-motion: no-preference)`. With reduce, a test confirms no element has a transition or animation.
- Touch targets at least 24 by 24 CSS pixels; most controls are 44 pixels tall. No text below 16px; body text is 18px.
- Each component starts in its own try/catch. If one throws, its original markup is restored and the rest still work.

## WCAG 2.1 success criteria addressed

| SC | How |
|---|---|
| 1.1.1 Non-text content | Decorative images and icons have `alt=""` or `aria-hidden="true"`; meaning is always in text |
| 1.3.1 Info and relationships | Headings, lists, landmarks, fieldset and legend, labels, table headers, ARIA relationships |
| 1.3.2 Meaningful sequence | DOM order equals visual order; tested by the Tab order test |
| 1.4.1 Use of colour | Feedback, selected tab and option marks use words or shape as well as colour |
| 1.4.3 Contrast (minimum) | All text pairs 4.5:1 or more (lowest 5.12:1); axe passes in every state |
| 1.4.4 Resize text | rem units, no fixed heights; cards tested at 200% text |
| 1.4.10 Reflow | No horizontal scroll at 320 by 640 and 320 by 256 CSS pixels |
| 1.4.11 Non-text contrast | Focus ring, control borders (4.41:1), selected tab bar (5.98:1) |
| 1.4.12 Text spacing | Override test: nothing clipped, no horizontal scroll |
| 1.4.13 Content on hover or focus | No content appears on hover or focus |
| 2.1.1 Keyboard | Every component operated by keyboard in tests |
| 2.1.2 No keyboard trap | Tab walk returns to the start |
| 2.2.2 Pause, stop, hide | Carousel rotation off by default, stoppable, stops on focus and hover |
| 2.3.3 Animation from interactions (AAA, honoured anyway) | Reduced motion removes all motion |
| 2.4.1 Bypass blocks | Skip link and landmarks |
| 2.4.2 Page titled | Descriptive title on every page |
| 2.4.3 Focus order | Tested; focus moved only by Try again and the skip link |
| 2.4.6 Headings and labels | Descriptive headings, distinct button names |
| 2.4.7 Focus visible | Ring on every focusable element, survives an LMS `outline: none` |
| 2.5.1 Pointer gestures | No swipe; buttons only |
| 2.5.3 Label in name | Visible label starts each accessible name |
| 3.1.1 Language of page | `lang="en"` |
| 3.2.1, 3.2.2 On focus, on input | No change of context on focus or selection |
| 3.3.1 Error identification | "No answer selected." in text, linked with `aria-describedby` |
| 3.3.2 Labels or instructions | Visible labels, "Select all that apply" in the legend |
| 4.1.1 Parsing | html-validate: 0 errors on all pages |
| 4.1.2 Name, role, value | Native controls; ARIA states kept in sync and tested |
| 4.1.3 Status messages | Checkpoint feedback in `role="status"` |

## Test matrix

All specs run in Chromium, Firefox and WebKit unless noted.

| Area | What is checked | Spec |
|---|---|---|
| axe-core | Initial; each accordion panel open; each tab; each card turned; each slide; rotation on; error, incorrect and correct feedback; stress.html; LMS stylesheet loaded last; stub pages; static markup | `axe.spec.js` |
| Accordion | Structure, aria-expanded, aria-controls, no region role, Enter and Space toggle once, several open | `accordion.spec.js` |
| Tabs | Roles, roving tabindex, arrows wrap, Home and End, rapid key presses, panel focus | `tabs.spec.js` |
| Flip cards | Names, no pressed or expanded state, one face rendered, focus kept, double click, independence, 200% text | `flipcards.spec.js` |
| Carousel | Semantics, hidden slides, wrap, double click, rotation timing with a fake clock, live region switching, stop on focus and hover, Stop by pointer | `carousel.spec.js` |
| Checkpoints | Structure, error state with describedby, correct and incorrect, multi-select counts, double press, Try again focus, no storage | `checkpoint.spec.js` |
| Keyboard | Tab order against DOM and visual order, no trap, ring width and contrast at every stop, skip link, keyboard-only operation | `keyboard.spec.js` |
| Display | Reduced motion (and a control showing motion exists without it), forced colours (Chromium), reflow at 320px, text spacing, text size and target size | `display.spec.js` |
| Resilience | No JavaScript, one component throwing, a missing script, duplicate instances and unique IDs, long labels, LMS stylesheet, subfolder copy, missing font, real Previous and Next links | `resilience.spec.js` |
| Markup | html-validate on all four HTML files (Chromium run only) | `validate.spec.js` |

`test/mutation-proof.js` breaks 18 behaviours one at a time (for example: stop updating aria-expanded, break the roving tabindex, stop the carousel's focus stop, stop writing to the status region, remove the focus outline) and confirms a test fails each time.

## Known observations

- NVDA + Firefox announced "expanded" twice after one Enter on an accordion button. `accordion.js` sets `aria-expanded` once per press (one click listener, no focus move or re-render, covered by the "toggle exactly once" test), so this looks like screen reader and browser event reporting, not a page defect; the code is unchanged and it will be rechecked with another NVDA version and in Chrome.

## Known limits

- VoiceOver with Safari not tested yet (see the table above).
- Forced colours are checked by emulation in Chromium only, not in Windows High Contrast itself.
- 400% zoom is checked as an equivalent 320 CSS pixel viewport, not by browser zoom.
- A theme that changes the root font size scales this page too, because sizes are in rem.
