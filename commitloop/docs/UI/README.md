# CommitLoop UI reference

Screenshots of student- and mentor-facing pages (captured locally with mocked GitHub auth and streak data).

| File | Route | Description |
|------|-------|-------------|
| `01-landing.png` | `/` | Marketing homepage |
| `02-curriculum-public.png` | `/curriculum` | Track 1 stage map (logged out) |
| `03-home-student-streak.png` | `/home` | Student dashboard with streak heatmap |
| `04-assignment-lesson.png` | `/assignment` | Lesson step |
| `05-assignment-sandbox.png` | `/assignment` | Sandbox step |
| `06-assignment-quiz.png` | `/assignment` | Quiz step |
| `07-assignment-project.png` | `/assignment` | Project checklist |
| `08-settings.png` | `/settings` | Repo link settings |
| `09-mentor-roster.png` | `/mentor` | Mentor student roster |

## Regenerate

```bash
cd commitloop
docker compose up -d postgres
npm install
npx playwright install chromium
npm run screenshots:capture
```

Uses `NODE_ENV=test` API with `/test/session` login and a mock GitHub client for streak data. **Not for production.**
