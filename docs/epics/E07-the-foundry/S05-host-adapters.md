# E07-S05 — Host adapters (Bitbucket first)

**Epic:** E07 The Foundry  
**MVP:** Yes (one Bitbucket instance)  
**Status:** Draft

## Outcome

Everything that talks to a Git host goes through an adapter. MVP implements Bitbucket for one instance. Later instances, GitHub, and GitLab plug in without rewriting Opening or Palimpsest.

## Scope

### In

Adapter capabilities:

- `resolvePullRequest(url) → identity`
- `cloneUrl` / fetch credentials
- `listCommits(pr)`
- `publishComments(pr, comments[])` onto the **pull request**
- `listPublishedComments(pr)` so a sitting can show what is already on the host

One configured Bitbucket instance (base URL + token).

### Out

- GitHub / GitLab implementations in MVP
- Posting to a commit SHA as the only destination
- Scraping the Bitbucket HTML UI

## Acceptance criteria

- [ ] Opening and Palimpsest call the adapter, not `if (bitbucket)` in UI code
- [ ] A second host can be registered without changing session schema
- [ ] `publishComments` targets PR comments / PR inline comments
- [ ] Missing token fails before a half-published batch
- [ ] Unsupported host is an explicit error

## Tasks

- [ ] Write `HostAdapter` interface
- [ ] Bitbucket implementation (Cloud or DC — pick from the real instance)
- [ ] Credential config (env + local secret file)
- [ ] Contract tests with recorded fixtures
- [ ] Document how Adapter Two (GitHub) would map

## Depends on

- E07-S01
- Used by E01-S01, E01-S05, E08

## Open questions

- Cloud vs Data Center
- App password vs repository access token
- Rate limits when opening many PRs in a day
