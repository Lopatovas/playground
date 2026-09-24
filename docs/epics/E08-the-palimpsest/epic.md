# E08 — The Palimpsest

**Practical name:** Comments and consecutive review  
**Status:** Draft  
**MVP:** Yes  
**Job:** 3 — actually review

## Intent

A palimpsest is a page written over: the new text is on top, the old writing is still there. That is consecutive review.

This epic is the Bitbucket failure we are replacing. Comments are drafted in the High Seat, published **onto the pull request**, and still make sense when the author pushes again. Reviewing a new commit must not exile those comments onto a SHA the PR UI forgets.

## Why this epic exists

Job 1 and job 2 are wasted if the actual review still happens in Bitbucket's file list, on the wrong comment object, with no memory of yesterday.

## Outcomes

- Draft inline (file / line / symbol) and general comments in Scryglass
- Batch-publish them to the Bitbucket **PR**
- Re-open the same PR and see what changed since the last sitting
- Old comments stay in context next to the new delta
- Incremental "new commits only" still publishes to the PR

## In scope

- Draft store on the session
- Comment anchors
- Batch publish via the host adapter
- Last-reviewed SHA / "what's new"
- Resume sitting
- Incremental commit review that does not post commit-only comments

## Out of scope

- AI-written comments
- Approving or declining the PR
- Slack / email notification
- GitHub / GitLab publish in MVP

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-draft-comments.md) | Draft comments in the High Seat | Yes |
| [S02](./S02-publish-to-the-pr.md) | Batch publish to the pull request | Yes |
| [S03](./S03-what-changed-since.md) | What changed since last sitting | Yes |
| [S04](./S04-resume-with-comment-context.md) | Resume sitting with old comments | Yes |
| [S05](./S05-incremental-commits.md) | Incremental new-commit review | Yes |

## Dependencies

- E01 session + workdir
- E05 High Seat surfaces
- E07-S05 host adapter

## Open questions

- Bitbucket PR inline-comment API vs general PR comments (what the instance actually supports)
- What we do when a line moved and the old inline comment cannot re-anchor
