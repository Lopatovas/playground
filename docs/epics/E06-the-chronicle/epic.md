# E06 — The Chronicle

**Practical name:** Review receipt  
**Status:** Draft  
**MVP:** After MVP (session JSON is enough until the cockpit loop is loved)  
**Job:** later — not one of the three

## Intent

Scryglass can leave a receipt: machine-readable and human-readable. Another engineer or agent can see what was observed — not a verdict that the PR is good.

The receipt is evidence: what changed, what was high-impact, what rendered, what was marked. It is not an approval stamp.

## Why this epic exists

A cockpit that vanishes when you close the tab cannot be handed to a teammate or an agent. The Chronicle is the portable slice of the session.

## Outcomes

- A schema that matches the brief's receipt
- `scryglass receipt` (or export) writes markdown + JSON
- Jev section cannot imply blocking
- A handoff path: "continue from this receipt"

## In scope

- Schema
- Generators
- Handoff conventions

## Out of scope

- Posting the receipt as a merge gate
- Replacing CI artifacts
- Turning the receipt into a Jira ticket

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-receipt-schema.md) | Receipt schema | After MVP |
| [S02](./S02-generate-receipt.md) | Generate human + machine receipts | After MVP |
| [S03](./S03-handoff-artifact.md) | Handoff artifact | After MVP |

## Dependencies

- A session that has at least E01 + E02 data
- E04 guardrails for the Jev section

## Open questions

- Is the first consumer of the receipt a human teammate or another agent?
- Do we attach stills or only list visual facts?
