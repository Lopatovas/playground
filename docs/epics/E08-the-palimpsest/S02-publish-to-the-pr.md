# E08-S02 — Batch publish to the pull request

**Epic:** E08 The Palimpsest  
**MVP:** Yes  
**Status:** Draft

## Outcome

The reviewer publishes one or many drafts in a single action. Every published comment lands on the **pull request**. None of them exist only on a commit SHA. That is the Bitbucket bug we refuse to re-create.

## Scope

### In

- Select drafts → publish
- Publish all
- Host adapter `publishComments`
- Mark drafts as published with host ids
- Fail a batch cleanly (nothing half-posted without a report)
- Never call the commit-comment API as the destination

### Out

- Approving the PR
- Publishing to GitHub in MVP
- Editing a comment already on the host (later)

## Acceptance criteria

- [ ] A published inline comment is visible on the Bitbucket PR, not only on a commit
- [ ] A published general comment is a PR comment
- [ ] Partial failure lists which drafts did not send
- [ ] Published drafts disappear from the draft drawer and appear as "sent"
- [ ] Tests / fixtures prove we do not post to commit comment endpoints

## Tasks

- [ ] Map anchors onto Bitbucket PR comment payloads
- [ ] Batch UI with confirm
- [ ] Idempotency (do not double-post the same draft)
- [ ] Record `hostCommentId` on the session
- [ ] Contract test against recorded Bitbucket responses

## Depends on

- E08-S01
- E07-S05

## Open questions

- Does this Bitbucket instance support PR inline comments on the merge diff?
- How we handle a line that no longer exists on the latest PR diff
