# Context from the design passes

This is what we now believe about the person Scryglass is for. Correct it if it is wrong.

## Who

A **frontend chapter lead at a consultancy**. First user is just them. They review other people's frontend PRs across many projects.

Stacks they actually see:

- Vue
- React
- Next
- PHP with Vue injected
- Electron

So "the target" is **the app inside the PR**, not Scryglass, and it is not one blessed repo. The floor must be generic. Framework adapters are how we get better on Vue/React/Next. PHP and Electron still need a usable diff + session.

## Three jobs

1. **Understand what the PR is.** Jira specs are often AI-generated walls of text. Running that through another model loses more context. The source of truth is the change and, especially, **what it looks like**. Visuals exist to answer "what feature is this trying to ship?", not to be a visual-regression product.
2. **How risky it is, and what the key points are.** Volume causes skimming. A heading on one page does not deserve the same minutes as a shared API change. Risk and key points are **computed** (imports, consumers, routes). Jev is not allowed to invent that graph. Line count cannot do it.
3. **Actually review, with a better UX.** Bitbucket is bad at consecutive review. Comments written against a commit do not show up on the PR. Scryglass is where comments are drafted, then **published to the pull request**. Coming back later must show what is new, keep old comments in context, and let them continue.

## Host

- **Now:** one Bitbucket instance, many repos.
- **Later:** more Bitbucket instances, then GitHub and GitLab. Host adapters belong in the Foundry.
- Opening a PR URL should be the normal start. The reviewer would rather not manually checkout. **Scryglass fetching and checking out for them is fine.**

## Jev

Jev is [TypeSafe AI's System One model](https://typesafe.ai/blog/introducing-system-one-models-and-jev): unstructured state in, typed decisions out. No prose. Question types are **Choice**, **Score**, and **Noul** (yes/no probability), each with calibrated confidence. Latency is meant to be tens-to-hundreds of milliseconds.

We do **not** have access yet. Design the contract and stub the client. Do not block the rest of Scryglass on a key. Job 2 must work from the graph alone.

## What this changed in the map

- "One Vue repo, local git only, no comments" is no longer the MVP story.
- **Job 2 is first-class and deterministic.** E02 is not a nice graph. It is how **risk** and **key points** are computed. Jev may not invent that.
- **No host access yet.** Dogfood is `fixtures/loom-shop` + `fixtures/blast-radius.mjs`.
- **The Palimpsest (E08)** is a core epic (job 3), not a later nice-to-have.
- Host checkout is Scryglass's job.
- Tickets stay optional. We will not sell an LLM Jira summary as understanding.
- Multi-framework is a real constraint, not a footnote.
