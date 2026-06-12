Refactor your Stage 4 full-stack slice into a **maintainable structure** — same behavior, better organization. Do all work on a feature branch.

## 1. Open a refactor branch

```bash
git switch -c refactor/structure
```

Every commit in this stage goes on this branch until you merge.

## 2. Add server-side validation

Pick your main entity (e.g. `workouts`). Before any database write:

- Reject missing or empty required fields
- Reject invalid types (string where number expected)
- Reject business-rule violations (e.g. negative duration)

Return **400** with a JSON error body. Confirm with `curl`:

```bash
curl -X POST http://localhost:3001/workouts \
  -H "Content-Type: application/json" \
  -d '{"name":""}'
```

Commit: `feat: validate workout input on server`.

## 3. Split the API into layers

Extract your Stage 4 code into at least:

```text
api/
  routes/     # thin HTTP handlers
  services/   # validation + business rules
  data/       # SQL / database access
```

Routes call services. Services call data. No SQL in route files.

Commit in small steps — e.g. `refactor: extract workout repository`, then `refactor: extract workout service`.

## 4. Upgrade the frontend states

Your list page must explicitly handle:

- **Loading** — while fetching
- **Error** — when the request fails
- **Empty** — when the array is `[]`
- **Success** — the populated list

Your create form should show **submitting** state and surface **400 errors** from the server.

Commit: `feat: handle loading, error, and empty states on workout list`.

## 5. Prove behavior is preserved

Manually verify (or write a quick checklist in your PR description):

- [ ] `GET` returns the same data as before the refactor
- [ ] `POST` with valid data still creates a row
- [ ] `POST` with bad data returns 400
- [ ] UI still lists and creates workouts end to end

## 6. Merge via pull request

```bash
git push -u origin refactor/structure
```

Open a PR on GitHub. Review your own diff — can you see the layers? Merge when checks pass.

```bash
git switch main
git pull
```

## Outcome

Your app does the same thing it did in Stage 4, but you can add a second entity without copy-pasting chaos. Next stage: ship it beyond your laptop.
