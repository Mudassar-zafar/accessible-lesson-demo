# Manual screen reader checklist: NVDA with Firefox on Windows

This checklist is for someone who has not used a screen reader before. It takes about 30 minutes. Write what you hear in the Result column: "OK" if it matches, or what you heard instead.

## Set up (once)

1. Install Firefox from mozilla.org if it is not already installed.
2. Download NVDA (free) from nvaccess.org and run the installer. Choose "Install NVDA on this computer".
3. Start NVDA with Ctrl + Alt + N. You will hear "NVDA started".
4. Learn the NVDA key: by default it is Insert. In the steps below, "NVDA + F7" means hold Insert and press F7.
5. To stop speech at any time, press Ctrl. To quit NVDA, press NVDA + Q, then Enter.
6. Open `index.html` from this folder in Firefox (drag the file onto the Firefox window).

Two ways of moving around:

- Browse mode (the default on web pages): Down Arrow reads the next line, H jumps to the next heading, D to the next landmark, B to the next button, F to the next form field.
- Focus mode: when you press Tab to a control, NVDA may switch to focus mode (a higher beep). Arrow keys then go to the control. Press Escape to go back to browse mode.

## Checks

| # | Do this | You should hear (roughly) | Result |
|---|---|---|---|
| 1 | Press Ctrl + Home, then Tab once | "Skip to main content, link" | |
| 2 | Press Enter, then Down Arrow | Lands in main content, then "Module 3: Giving feedback that helps" | |
| 3 | Press NVDA + F7, choose "Landmarks" with Alt + D | banner, Breadcrumb navigation, main, Real-world scenarios region (the carousel), Lesson pages navigation, content info. No other regions. Press Escape | |
| 4 | Press NVDA + F7, choose "Headings" with Alt + H | One heading level 1 "How to give feedback people can use", level 2 section headings, level 3 below them. Press Escape | |
| 5 | Press H until "Four parts of useful feedback", then B | "Context: name the moment, button, collapsed" | |
| 6 | Press Enter | "expanded". Press Down Arrow: the panel text "Tie the feedback to one specific time..." | |
| 7 | Press B to the next accordion button, then Space, then Space again | "expanded", then "collapsed". Each press changes it once | |
| 8 | Press H until "Same situation, three approaches", then Tab until a tab is focused | "Same situation, three approaches, tab list. Vague, tab, selected, 1 of 3" | |
| 9 | Press Right Arrow | "Harsh, tab, selected, 2 of 3" | |
| 10 | Press End, then Home | "Useful ... 3 of 3", then "Vague ... 1 of 3" | |
| 11 | Press Tab | Focus moves into the panel; the Vague example is read | |
| 12 | Press H until "Myth or fact?", then B | "Show answer: praise first makes criticism easier to hear, button" | |
| 13 | Press Enter | Listen: does NVDA say the new name "Show statement: ..."? Then press Up Arrow once or twice: you should hear the answer "People learn to wait for the..." and "Myth" | |
| 14 | Press Enter again | The button goes back to "Show answer: ..." and focus stays on it | |
| 15 | Press H until "Real-world scenarios", then Tab | "Real-world scenarios, carousel, region" (or similar), then "Start slide rotation, button" | |
| 16 | Press Tab twice to "Next slide", then Enter | The new slide is read once, for example "2 of 4, slide ... The repeated mistake" | |
| 17 | Shift + Tab back to "Start slide rotation", press Enter | Button now says "Stop slide rotation". Slides should NOT be read aloud as they change | |
| 18 | Press Tab | Focus moves to "Previous slide". Shift + Tab: the button is back to "Start slide rotation" (rotation stopped) | |
| 19 | Press H until "Check your understanding", then F | "A teammate's slides had several errors..., grouping" and the first radio button | |
| 20 | Press Tab to "Check answer" without choosing, press Enter | "No answer selected. Select an option, then select Check answer." read once. Focus stays on the button | |
| 21 | Shift + Tab to the radios, press Down Arrow to choose the second option, Tab to "Check answer", press Enter | "Correct. It names the moment..." read once | |
| 22 | Press Enter on "Check answer" again | Nothing new is read | |
| 23 | Shift + Tab to the chosen radio | Its name now ends with "Correct choice" | |
| 24 | Tab to "Try again", press Enter | Focus moves to the first radio button and it is unchecked | |
| 25 | In question 2, tick "Comparing the person with a colleague" with Space, Tab to "Check answer", press Enter | "Not quite. You found 0 of 3 helpful options and chose 1 that does not help..." | |
| 26 | Press H to "Accessibility notes", then T | The table is read with its caption "How this page has been tested so far" | |
| 27 | Press D until the "Lesson pages" navigation, then Tab | "Previous page Why feedback matters, link" and "Next page Planning the conversation, link" | |

## Afterwards

- Note the NVDA version (NVDA menu with NVDA + N, Help, About) and the Firefox version.
- Anything heard twice, not heard at all, or heard in an unexpected order is worth reporting, with the step number.
