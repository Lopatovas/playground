# Principles

Every epic, story, and UI copy must obey these. If a design violates one, the design is wrong.

**Platform rule: deterministic except Jev.**

Git, AST, imports, consumers, routes, tests, screenshots — computed. Risk and key points come from that graph, not from a model. Jev may classify a small structured payload. It may not draw edges, invent blast radius, write the "what is this PR" story, or set risk. If Jev is offline, Scryglass still works.

**Prefer absorbing open-source engines.** Graph, diff, and browser tools are not our moat. Wrap them. Our moat is the three jobs in one seat, plus Bitbucket comments that survive a second sitting. See [tools.md](./tools.md).

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
- an LLM restatement of the Jira ticket as "what this PR is"

A model may classify small structured facts (Jev). It must not be the reviewer. Understanding comes from the change and the UI.

## 3. Focus is a job, not a sort of the file list

The problem is not lack of information. It is deciding what deserves minutes.

A heading component on one page and a shared API abstraction are not the same event. Scryglass should answer: **where should I look first?**

Blast radius is one input. Attention is a **bundle of computed flags** (layer, contract, tests, surface, change shape, history). If the UI still leads with LOC, path alphabet, or a single consumer count, job 2 has failed.

## 4. Human judgment is the last layer

Surface evidence, relationships, visual output, change scope, and attention signals.

The engineer decides what they mean.

Never block a PR on a Whisper Mark. Never call model output a review, an approval, or a correctness result.

## 5. Visual understanding is first-class

For frontend work, code alone is insufficient. The reviewer should be able to answer "what does this PR actually do?" by seeing the application.

The Mirror is for **comprehension**, not visual-regression gating. A still that shows the feature is a win even if we never compute a pixel diff.

Prefer the real app. Storybook is a useful extra source, not the only one.

## 6. Graphs come from the repository, not from a model

The Web of Threads is derived from git, AST, imports, router config, tests, and similar facts.

A model may *annotate* nodes. It may not *invent* edges, consumer counts, or routes.

## 7. Deterministic first, probabilistic second

If a fact can be computed, compute it. Risk is a fact-shaped score (reach, layer, sharing), never a Jev verdict.

Use Jev only on small structured inputs when a fast extra "look here" signal is still useful. The product must remain useful if Jev is offline.

## 8. Never present a guess as a verdict

Whisper Marks are signals. UI language, colors, and receipts must keep that obvious. Confidence belongs next to the mark. Blocking decisions do not.

## 9. Comments belong on the pull request

Drafts may live in Scryglass. Published comments must land on the **PR**, not only on a commit. That is the Bitbucket failure we are replacing.

Scryglass publishes the reviewer's words. It does not write them.

## 10. Hosts and frameworks are adapters

One Bitbucket instance is enough for MVP. The interface must allow another Bitbucket, GitHub, and GitLab later.

Language analysis has a generic JS/TS floor. Vue, React, Next, PHP, and Electron get better through adapters. A stack we do not understand must still open as a session and a diff.

## 11. Tickets are optional

Do not require the reviewer to read the ticket. Do not make a ticket summary the product. A PR title or a link is enough. The change and the Mirror explain the feature.
