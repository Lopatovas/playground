# E01-S03 — Extract changed symbols

**Epic:** E01 The Opening  
**MVP:** Yes  
**Status:** Draft

## Outcome

The session names the units that actually changed: functions, classes, components, composables, stores, exports. A reviewer can see "3 methods in `customerApi.ts`" instead of "file touched."

## Scope

### In

- TypeScript / JavaScript via compiler API or ts-morph (the floor for every repo)
- Framework extras (Vue SFC, React components) only when an adapter is present
- Map each hunk to overlapping symbols
- Record new vs modified vs deleted symbols
- Export / public-API vs local helper when the AST makes it obvious
- PHP / other languages: file-level change is enough in MVP; do not fake symbols

### Out

- Full-repo dependency graph (E02)
- Template-only Vue changes that need the Vue adapter's template pass (note them, deeper work in E02-S06)
- Deep PHP or Electron-main-process analysis
- LLM-based "this file seems to define a service"

## Acceptance criteria

- [ ] A modified exported function is listed by name with file and line range
- [ ] A new Vue/React component file lists the component as a new symbol
- [ ] A file with only whitespace / comment change can have zero symbols
- [ ] Symbol extraction is deterministic: same diff → same symbol list
- [ ] Failures on a single file do not abort the session; the file is marked unparsed

## Tasks

- [ ] Pick the AST library (ts-morph is the default candidate)
- [ ] Map hunk line ranges onto AST nodes
- [ ] Normalize symbol kinds: `function`, `class`, `component`, `composable`, `store`, `type`, `other`
- [ ] Vue SFC script extraction for the first adapter
- [ ] Fixture tests: added export, edited method, deleted function, comment-only, unparsable file

## Depends on

- E01-S02
- E07-S03 / E02-S06 for framework-specific symbol kinds (TS/JS first)

## Open questions

- Do types and interfaces count as first-class symbols in MVP?
- How do we name `<script setup>` bindings that are not exported?
