## The spaghetti moment

In Stages 2–4 you built a full stack that works — UI, API, database. Congratulations — that's real engineering.

Then you add a second feature. And a third. Suddenly:

- SQL strings appear inside route handlers
- The same validation logic is copy-pasted across three endpoints
- The frontend fetches data but has no loading or error UI
- You're afraid to touch one file because everything is tangled together

That's the **spaghetti moment**. It happens to every project that grows without structure.

## Structure is not bureaucracy

"Architecture" sounds like something for big companies. It's not. Structure is simply **giving each piece of code one job** so you can change one part without breaking everything else.

| Without structure | With structure |
| --- | --- |
| One giant file does HTTP + SQL + rules | Routes handle HTTP, services hold rules, data layer talks to the DB |
| Frontend assumes data always loads | UI handles loading, error, empty, and success |
| Invalid input crashes the server | Server validates and returns 400 |
| Refactors feel terrifying | Small commits on a branch, behavior preserved |

## The goal of this stage

You are **not** adding features. You are **reorganizing** what you built in Stages 2–4 so it can grow.

By the end:

- Your API validates input and returns proper status codes
- Business logic lives in a service layer, not in route handlers
- Your frontend handles all four data states
- You did the refactor on a feature branch and merged via PR

Same app. Same behavior. Better bones.

## One repo, evolving forward

Remember: you do **not** start a new repository. You refactor the same project you've been building since Stage 0. Git history from your vertical slice stays — that's the point.

> Structure is what lets a six-month-old codebase still feel approachable on a Tuesday morning.
