## Open DevTools before you guess

**Chrome DevTools** (F12, or right-click → Inspect) is the first tool you reach for when the page looks wrong. Track 1 uses vanilla HTML/CSS/JS — no framework hiding the DOM — so what you see in DevTools is what you shipped.

This stage starts with the **Elements** panel: the live tree of HTML nodes and the CSS rules applied to whichever node you select.

## Opening DevTools

1. Open any page in Chrome (even `about:blank` with a saved HTML file works).
2. Press **F12** or **Cmd+Option+I** (macOS) / **Ctrl+Shift+I** (Windows/Linux).
3. Click the **Elements** tab.

You'll see two main regions:

| Region | Shows |
| --- | --- |
| **DOM tree** (left) | Nested HTML tags as the browser parsed them |
| **Styles pane** (right) | CSS rules affecting the selected node |

## Selecting a node

- **Click** a tag in the DOM tree to select it.
- Or use the **element picker** (cursor-in-box icon, top-left of DevTools) and click something on the page.

The selected node highlights on the page with a colored overlay. The Styles pane updates to show every rule that applies — including inherited and overridden properties.

## Live-editing CSS

In the Styles pane you can toggle checkboxes next to properties or type new declarations. Changes are **temporary** — they prove a fix works before you edit your `.css` file.

```css
/* typed in DevTools on a selected .card element */
background: var(--surface);
padding: 1rem;
```

Refresh the page and live edits disappear. That's intentional: DevTools is for **experimentation**, your source files are for **truth**.

## Inspecting the box model

Scroll to the bottom of the Styles pane (or open the **Layout** section). You'll see **margin → border → padding → content**. When spacing looks off, this diagram tells you which layer is responsible.

## Device toolbar — responsive preview

Click the **device toolbar** icon (phone/tablet) or press **Cmd+Shift+M** / **Ctrl+Shift+M**. The viewport shrinks so you can test phone-width layouts without resizing the whole browser window.

Set a width like **375px** and watch flex items wrap or stack. You'll wire real `@media` rules in the responsive lesson — DevTools is how you **validate** them.

## What Elements does *not* do

- **Console** — JavaScript errors and `console.log` (Stage 3).
- **Network** — HTTP requests from `fetch` (Stage 6).

For HTML and CSS problems, stay in Elements until the layout is right. That's the habit: inspect, tweak, then commit the fix in your repo.
