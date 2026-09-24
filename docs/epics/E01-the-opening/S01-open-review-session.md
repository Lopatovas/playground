# E01-S01 — Open a review session from a PR URL

**Epic:** E01 The Opening  
**MVP:** Yes  
**Status:** Draft

## Outcome

The chapter lead pastes a Bitbucket PR URL and gets a session identity: host, project, repo, PR id, base, head, SHAs. That is the normal door into Scryglass.

## Scope

### In

- `scryglass open <pr-url>` and a High Seat "open" field
- Parse Bitbucket PR URLs for the one instance we care about now
- Resolve identity via the host adapter (title, authors, base, source, SHAs)
- Escape hatch: `--base` / `--head` against an already-local repo
- Same PR id → resume the existing session (see E08)

### Out

- Manual clone by the reviewer (that is S05)
- Ticket body fetch as a required step
- GitHub / GitLab URL success in MVP (parse-and-say-unsupported is OK)

## Acceptance criteria

- [ ] A valid Bitbucket PR URL produces a session with host, PR id, base SHA, head SHA
- [ ] An unsupported host URL fails with "no adapter", not a stack trace
- [ ] `--base` / `--head` still works without a URL
- [ ] Opening the same PR URL a second time resumes the same session id
- [ ] Auth failure from Bitbucket is readable ("token missing / denied")

## Tasks

- [ ] Define `ReviewSessionIdentity` (`id`, `host`, `prId`, `prUrl`, `repoSlug`, `baseRef`, `headRef`, `baseSha`, `headSha`, `title`, `openedAt`)
- [ ] Bitbucket URL parser
- [ ] Host-adapter `resolvePullRequest(url)`
- [ ] Resume-by-`(host, prId)`
- [ ] Tests: good URL, bad URL, unsupported host, missing token

## Depends on

- E07-S01
- E07 host adapter story

## Open questions

- App password vs workspace token vs existing browser session
- Do we store the PR title as the "feature" hint in the header?
