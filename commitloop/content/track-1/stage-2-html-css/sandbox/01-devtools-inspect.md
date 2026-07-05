Create a minimal page and inspect it.

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>DevTools drill</title>
  </head>
  <body>
    <p id="greeting">Hello</p>
  </body>
</html>
```

Open the file in Chrome (drag into the browser or use **File → Open**). Open DevTools → **Elements**. Click `<p id="greeting">` in the DOM tree.

In the **Styles** pane, add a live rule:

```css
color: steelblue;
font-size: 20px;
```

The text on the page updates immediately. Refresh — the change is gone. That's the difference between DevTools experiments and committed CSS.
