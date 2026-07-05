## Dev mode is not production

Locally you run:

```bash
npm run dev   # hot reload, verbose errors, unoptimized
```

Production runs a **build** first:

```bash
npm run build
npm start     # serves optimized output
```

| | Dev | Production |
| --- | --- | --- |
| Speed to iterate | Fast | Slower build, fast runtime |
| Error detail | Verbose | Sanitized |
| Asset size | Large | Minified |
| Safe for users | No | Yes |

Run `npm run build` locally before your first deploy. Fix TypeScript and bundling errors on your machine, not in production logs.

## API build

For a TypeScript Express API:

```bash
npm run build    # tsc → dist/
node dist/index.js
```

Or use `tsx` / `ts-node` only in dev — production should run compiled JS or a stable start command your host documents.

## Web build

Next.js:

```bash
npm run build    # .next/ output
npm start        # production server
```

Vercel often runs build + start for you on git push.

## CI mindset

If build fails, deploy should **not** go live. Later you'll wire this into GitHub Actions. For now: treat a green local `npm run build` as a deploy gate.
