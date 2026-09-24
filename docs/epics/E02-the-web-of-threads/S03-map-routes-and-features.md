# E02-S03 — Map routes and features

**Epic:** E02 The Web of Threads  
**MVP:** Yes  
**Status:** Draft

## Outcome

Changed work is attached to routes and features the reviewer already understands: `/customers`, Customer Search, not only `useCustomerStore.ts`.

This is also how the Living Mirror knows what to open.

## Scope

### In

- Router definitions for the first framework (Vue Router or file-based Next/React routes)
- Page / layout components as feature entry nodes
- Walk: changed symbol → page → route
- A pragmatic "feature" label (folder, route prefix, or page name)

### Out

- Perfect product-taxonomy of features
- Ticket or Jira feature names
- Rendering the route (E03)

## Acceptance criteria

- [ ] Changing a page component lists its route
- [ ] Changing a store used by two pages lists both routes
- [ ] Unrouted shared utilities can have zero routes
- [ ] Route mapping is deterministic and stored on the session
- [ ] Output is enough for E03 to attempt a navigation list

## Tasks

- [ ] Parse the first adapter's route table
- [ ] Link page components to paths, including params (`/customers/:id`)
- [ ] Attribute routes to changed symbols via the consumer graph
- [ ] Define `Feature` as a grouping key (document the heuristic)
- [ ] Fixture tests: nested route, layout-only change, shared store, no route

## Depends on

- E02-S02
- E02-S06 for router specifics

## Open questions

- Feature = route prefix, folder under `src/features`, or page name?
- How do we treat modal-only or host-app embedded views with no route?
