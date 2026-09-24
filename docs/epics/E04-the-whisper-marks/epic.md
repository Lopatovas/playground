# E04 — The Whisper Marks

**Practical name:** Fast attention classification (Jev)  
**Status:** Draft  
**MVP:** Optional sharpener — job 2 already works from E02-S05  
**Job:** 2 — where focus should go

## Intent

Jev is [TypeSafe AI's System One model](https://typesafe.ai/blog/introducing-system-one-models-and-jev): unstructured state in, typed decisions out. It does not generate prose. It answers small questions (Choice, Score, Noul) that help a human look in the right place. It can be semantically wrong. That is acceptable. It must never be presented as authoritative.

We do not have API access yet. The contract and a deterministic stub ship first.

Scryglass must not say "this code is bad." It may say "this is likely shared, data-flow, and worth a look."

## Why this epic exists

Deterministic graphs answer *reach*. They do not always answer *weirdness* or *business-logic-ish*. A cheap probabilistic layer can mark those. If we let it write reviews, we have built the wrong product.

## Outcomes

- Jev receives small structured facts, never the whole repository as a first prompt
- Each mark has categories, a coarse attention level, and confidence
- The attention map is a signal merged with E02 ranks
- UI and receipts refuse review/approval/blocking language

## In scope

- Input contract
- Classification questions
- Attention-map composition
- Guardrails in data, UI copy, and receipts

## Out of scope

- Generated review comments
- Autonomous approval
- Blocking merge
- Feeding the entire diff to a long-context "review this" prompt

## Stories

| ID | Title | MVP |
| --- | --- | --- |
| [S01](./S01-attention-input-contract.md) | Attention input contract | Yes (even before Jev) |
| [S02](./S02-classify-attention.md) | Classify attention with Jev | After access (stub in MVP) |
| [S03](./S03-compose-attention-map.md) | Compose the attention map | Yes (can be deterministic-only) |
| [S04](./S04-attention-guardrails.md) | Attention guardrails | Yes |

## Dependencies

- E02 nodes and counts as the payload
- A defined Jev interface (open question)

## Open questions

- TypeSafe key / early access
- How we show disagreement between graph rank and Jev rank
- Whether we ever send a short hunk, or only structured graph facts
