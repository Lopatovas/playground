# E02-S04 — Attach tests and stories

**Epic:** E02 The Web of Threads  
**MVP:** Yes (thin)  
**Status:** Draft

## Outcome

Changed symbols point at related tests and Storybook stories when the link is factual: import, colocated name, or existing Playwright spec. The reviewer can jump there. Scryglass does not claim coverage is sufficient.

## Scope

### In

- Tests that import a changed file/symbol
- Colocated conventions: `foo.ts` + `foo.spec.ts` / `foo.test.ts`
- Playwright specs that mention an affected route (string match is OK for MVP)
- Changed Storybook files as story targets for E03

### Out

- Mutation coverage
- "You should add a test" advice
- Running the tests (optional later; linking is the story)
- Inventing tests that should exist

## Acceptance criteria

- [ ] A changed module with a colocated spec lists that spec
- [ ] A test file that imports the module is listed even if not colocated
- [ ] No related test is a valid result
- [ ] Story files that import the component are listed
- [ ] Test/story links are stored as graph nodes, not prose

## Tasks

- [ ] Index test and story files in the target repo
- [ ] Import-based linking
- [ ] Convention-based linking
- [ ] Weak route-string linking for e2e specs (flag as low-confidence)
- [ ] Fixture tests for each link kind and for "none"

## Depends on

- E02-S01, E02-S03 (for route-string hints)

## Open questions

- Which test runners does the first repo actually use?
- Is Storybook present, or is this mostly a later Mirror fallback?
