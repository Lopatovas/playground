## Structure is not decoration

HTML is not "div soup." Tags carry **meaning** — to the browser, to future you, and to any script that queries the page. **Semantic HTML** uses the right element for the job instead of a generic `<div>` everywhere.

## Page skeleton

A typical app shell looks like this:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Workout Tracker</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="app-header">
      <h1>Workout Tracker</h1>
      <nav aria-label="Main">
        <a href="#list">List</a>
        <a href="#add">Add</a>
      </nav>
    </header>

    <main id="app">
      <!-- views go here -->
    </main>

    <footer>
      <p>Built with CommitLoop</p>
    </footer>
  </body>
</html>
```

| Tag | Role |
| --- | --- |
| `<header>` | Top bar: branding, nav |
| `<main>` | Primary content — one per page |
| `<nav>` | Navigation links |
| `<footer>` | Secondary info |
| `<section>` | Thematic grouping inside `<main>` |
| `<article>` | Self-contained item (e.g. one workout card) |

## Forms and labels

Forms are semantic too. Always pair `<label>` with an input — by `for`/`id` or by wrapping:

```html
<form id="add-form">
  <label for="workout-name">Name</label>
  <input id="workout-name" name="name" required />

  <label for="duration">Minutes</label>
  <input id="duration" name="duration_min" type="number" required />

  <button type="submit">Add workout</button>
</form>
```

`<button type="submit">` inside a form triggers submit. `<button type="button">` is for JS-only actions.

## Lists

Use the list that matches the content:

```html
<ul>
  <li>Morning run</li>
  <li>Yoga</li>
</ul>
```

An empty list is fine for now — Stage 3 will fill it with JavaScript.

## Why semantics matter (even without accessibility audits)

- **CSS hooks** — `header`, `main`, `form` are stable selectors.
- **JavaScript** — `document.querySelector("main")` finds the right region.
- **Reading the code** — six months later you know what each region is for.

Track 2 covers WCAG depth. Track 1 goal: **correct structure** you can build on.

## Anti-patterns to avoid

```html
<!-- bad: everything is a div -->
<div class="header">...</div>
<div class="main">...</div>

<!-- better -->
<header>...</header>
<main>...</main>
```

```html
<!-- bad: placeholder div -->
<div class="button" onclick="...">Add</div>

<!-- better -->
<button type="button">Add</button>
```

Open your page in DevTools Elements and confirm the tree reads like an outline, not a flat list of `<div>`s.
