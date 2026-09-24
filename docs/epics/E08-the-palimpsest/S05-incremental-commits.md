# E08-S05 — Incremental new-commit review

**Epic:** E08 The Palimpsest  
**MVP:** Yes  
**Status:** Draft

## Outcome

The reviewer can walk new commits (or the since-diff) without Bitbucket's "I commented on a commit and it vanished from the PR" trap. Whatever they write still publishes to the **pull request**.

## Scope

### In

- A commit list for the PR, with "new since last sitting" marked
- Optional focus on one new commit's files for navigation
- Comments composed in that mode still use PR anchors (file + line on the merge diff, or general)
- If we cannot map a commit line onto the PR diff, refuse to publish rather than post a commit comment

### Out

- Commit-comment fallback
- Per-commit approval

## Acceptance criteria

- [ ] Selecting a new commit shows its files
- [ ] Publishing from that view creates a PR comment
- [ ] If the line is not on the PR diff, publish is blocked with an explanation
- [ ] No code path posts to the commit-comment API
- [ ] Combined with S03, this is the consecutive-review loop

## Tasks

- [ ] Commit list UI
- [ ] Map commit hunk → current PR diff line when possible
- [ ] Hard-fail publish when mapping fails
- [ ] Guard test: commit-comment endpoint never called
- [ ] Manual script on a PR that gained two commits

## Depends on

- E08-S02, E08-S03

## Open questions

- Is commit-walk necessary in MVP if "what's new" (S03) is good enough? Keep the story; we can collapse it if the since-diff is the only mode we need.
