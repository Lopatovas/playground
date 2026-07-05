Apply Git habits to your real project. The aim of this stage isn't a feature — it's **rhythm and workflow**.

## 1. Give the project a structure

Add a sensible starting layout for a full-stack app. You don't need code yet, just intentional folders:

```text
your-repo/
  api/        # Express backend (built in Stage 3)
  web/        # frontend (built in Stage 2)
  README.md
```

```bash
mkdir api web
git add .
git commit -m "chore: scaffold api and web folders"
```

## 2. Add a `.gitignore`

You must never commit dependencies, secrets, or build output. Create a `.gitignore` for your stack:

```text
node_modules/
.env
dist/
*.log
```

```bash
git add .gitignore
git commit -m "chore: add gitignore for node project"
```

## 3. Make it run locally

Add the smallest thing that runs — even a `hello.js` that prints a line, or `npm init -y` plus a start script. The point is a repo you can actually execute.

## 4. Do one thing on a feature branch

Practice the workflow end to end:

```bash
git switch -c feature/readme-setup-notes
# edit README to document how to run the project locally
git add README.md
git commit -m "docs: add local setup instructions"
git push -u origin feature/readme-setup-notes
```

Open a **pull request** on GitHub and merge it into `main`. Then update your local main:

```bash
git switch main
git pull
```

## 5. Build the streak

- Push **3+ meaningful commits**.
- Make sure at least one commit lands on a **second, separate day** — consistency is the habit we're building.
- Check your CommitLoop dashboard: the activity should show up.

## Outcome

Your project has structure, ignores what it should, runs locally, and you've completed a full feature-branch → pull-request → merge cycle. Git is now a daily habit, not an afterthought. Next stage: build the frontend.
