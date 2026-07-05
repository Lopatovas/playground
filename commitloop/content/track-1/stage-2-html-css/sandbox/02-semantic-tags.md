Replace div soup with semantic regions.

```html
<body>
  <header>
    <h1>Recipe Book</h1>
  </header>
  <main>
    <section aria-labelledby="list-heading">
      <h2 id="list-heading">Recipes</h2>
      <ul>
        <li>Pasta</li>
      </ul>
    </section>
  </main>
  <footer>
    <p>CommitLoop practice</p>
  </footer>
</body>
```

Open Elements and expand `<body>`. You should see `header → main → section → … → footer` — an outline a human can read.

Avoid this:

```html
<div class="header">...</div>
<div class="content">...</div>
```

Semantic tags are free structure you keep for the rest of the track.
