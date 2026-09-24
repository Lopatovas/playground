# E08-S03 — What changed since last sitting

**Epic:** E08 The Palimpsest  
**MVP:** Yes  
**Status:** Draft

## Outcome

The second sitting opens with a clear delta: commits, files, and symbols that moved **since the last time this reviewer sat here**. That is the consecutive-review job. The full PR is still available; "what's new" is the default door.

## Scope

### In

- `lastReviewedHeadSha` on the session
- Diff `lastReviewed…head` (three-dot)
- A "what's new" list: commits, files, symbols
- Job 2 re-run on the new slice so a newly touched shared API still outranks a heading
- Mark sitting complete (update `lastReviewedHeadSha`)

### Out

- Hiding the rest of the PR
- Treating "what's new" as a separate comment destination

## Acceptance criteria

- [ ] First sitting has no "since" (the whole PR is new)
- [ ] After a fetch that adds commits, the next open shows those commits and their files
- [ ] A file unchanged since last sitting is not in the default "new" list
- [ ] The reviewer can switch to the full PR map
- [ ] Completing a sitting stores the current head SHA

## Tasks

- [ ] Store last-reviewed SHA
- [ ] Compute since-diff on open / fetch
- [ ] High Seat "what's new" mode
- [ ] Re-slice E02 for the new files
- [ ] Tests: first sitting, no-op fetch, new commits, force-push (base case: say "history moved")

## Depends on

- E01-S05 (fetch on resume)
- E02-S05 (focus on the new slice)
- E05-S02

## Open questions

- Force-push / rebase: warn and reset, or try to map?
- Do we treat "new sitting" as explicit, or any fetch that moves HEAD?
