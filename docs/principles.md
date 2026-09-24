# Principles

Every epic, story, and UI copy must obey these. If a design violates one, the design is wrong.

## 1. Do not optimize for line count

LOC is almost useless here. Three thousand lines can be normal. Ask: **what changed that could matter?**

Impact, sharing, blast radius, and data-flow beat file size.

## 2. Do not build another AI reviewer

Do not ship:

- giant model-written summaries as the product
- generated review comments
- "LGTM" agents
- generic quality opinions
- autonomous approval

A model may classify small structured facts. It must not be the reviewer.

## 3. Reduce search cost

The problem is not lack of information. It is finding the relevant information.

Scryglass should answer: **where should I look first?**

## 4. Human judgment is the last layer

Surface evidence, relationships, visual output, change scope, and attention signals.

The engineer decides what they mean.

Never block a PR on a Whisper Mark. Never call model output a review, an approval, or a correctness result.

## 5. Visual understanding is first-class

For frontend work, code alone is insufficient. The reviewer should be able to answer "what does this PR actually do?" by seeing the application.

Prefer the real app. Storybook is a useful extra source, not the only one.

## 6. Graphs come from the repository, not from a model

The Web of Threads is derived from git, AST, imports, router config, tests, and similar facts.

A model may *rank* nodes. It may not *invent* edges.

## 7. Deterministic first, probabilistic second

If a fact can be computed, compute it. Use Jev on small structured inputs when a fast "look here" signal is still useful.

The product must remain useful if Jev is offline.

## 8. Never present a guess as a verdict

Whisper Marks are signals. UI language, colors, and receipts must keep that obvious. Confidence belongs next to the mark. Blocking decisions do not.
