# TRACK 2 — PLATFORM IMPLEMENTATION (IMPLEMENTATION AGENT)

## Overview

The platform is an accountability-driven engineering apprenticeship system.

Its purpose is not simply to deliver content.

Its purpose is to help students consistently execute.

The platform combines:

- Curriculum delivery
- Assignments
- GitHub tracking
- Accountability
- Mentor communication

---

## Product Goal

Help students:

- Build software consistently
- Develop engineering habits
- Finish projects
- Learn professional workflows

---

## Core Components

### 1. Curriculum System

CommitLoop supports **multiple curriculum tracks**. Each track is a self-contained apprenticeship path (e.g. Track 1: Fundamentals, Track 2: Frontend & React). See `docs/curriculum.md` for track definitions.

Content format (per unit, all tracks):

Lesson
→ Sandbox Task
→ Comprehension Quiz (must pass to unlock Project)
→ Project Implementation
→ Checklist → advance

Curriculum content stored as **hybrid JSON + Markdown**:

- `track.json` — track manifest (stage list, availability)
- Per-stage folder: `stage.json` (goal, checklist, quiz) + `lesson.md`, `sandbox.md`, `project.md`
- Version controlled under `commitloop/content/`
- Validated with Zod + `npm run content:check` in CI
- `_template/` for authoring new stages

See `docs/curriculum.md` for full content structure.

Students enroll in one track at a time. Platform must support:

- Track catalog and descriptions
- Track enrollment without cross-track prerequisites (tracks are independent entry points)
- Per-track progress (stage/phase, current assignment)
- Track-specific graduation criteria

---

### 2. Assignment System

Each curriculum unit contains:

#### Lesson

Theory and explanation (`lesson.md`)

#### Sandbox Task

Small isolated exercise (`sandbox.md`)

#### Comprehension Quiz

Structured questions from `stage.json`. Server-side grading. Project tab locked until pass threshold met (default 80%). Retry with explanations on wrong answers.

#### Project Implementation

Apply concept inside personal project (`project.md`)

#### Checklist

Verifiable deliverables from `stage.json`. Manual ticks in v1. Advance to next stage when complete.

Assignments are linked to curriculum progression. User progress stores `currentStep`, `checklistState`, `quizState`, and `quizPassed` (reset on stage advance).

---

### 3. Student Project System

Per active track, every student owns:

- One GitHub repository
- One evolving application
- One selected domain

Projects persist for the **entire track**. No resets within a track. Refactors and stack migrations (e.g. vanilla JS → React → React Native) are valid forward progress.

Students may start a new repository when beginning a new track.

---

### 4. GitHub Integration

Each student connects:

- GitHub account
- Repository

Tracked data:

- Commit count
- Last activity date
- Commit streak
- Branch activity
- Pull request activity

GitHub is the source of truth.

---

### 5. Accountability Engine

Core rule:

Students must make continuous progress.

Default expectation:

- One meaningful commit per day

Acceptable commits:

- Features
- Refactors
- Bug fixes
- Documentation
- Tests

Platform tracks:

- Active today
- Missed today
- Current streak
- Longest streak

---

### 6. Workflow Progression

Stage 1:

- Direct commits

Stage 2:

- Feature branches

Stage 3:

- Pull requests

Stage 4:

- PR reviews

Platform should support increasing workflow sophistication.

---

### 7. Mentor System

Mentors can:

- View student progress
- View GitHub activity
- Review selected PRs
- Respond to questions

Mentors should not:

- Write code for students
- Complete assignments

---

### 8. Communication Layer

Primary communication:

Discord

Usage:

- Questions
- Support
- Clarification
- Community

GitHub remains the source of truth for work.

---

## Dashboard Requirements

Student View:

- Current track
- Current stage or phase
- Current assignment
- Commit streak
- Recent activity
- Upcoming tasks

Mentor View:

- Student list
- Activity overview
- Inactive students
- Streaks
- Repository links

---

## MVP Scope

### Must Have

- Authentication ✅
- Student profiles ✅
- GitHub integration ✅
- Curriculum pages ✅
- Assignment pages ✅
- Assignment-first home + streak panel ✅
- Discord links (env var ready)

---

### Later Features

- Automated reminders
- PR review workflows
- Analytics
- Cohorts
- Peer reviews
- Leaderboards

---

## Success Metrics

Student metrics:

- Daily activity rate
- Assignment completion rate
- Deployment completion rate
- Retention

Platform metrics:

- Weekly active students
- Commit frequency
- Completion percentage
- Cohort completion rate

---

## Core Principle

The platform is not optimized for content consumption.

The platform is optimized for:

Consistency → Accountability → Skill Development

---

## Final Outcome

Students should leave the platform with:

- A deployed application
- A GitHub history demonstrating growth
- Familiarity with professional workflows
- Strong engineering habits
- Confidence building software independently
