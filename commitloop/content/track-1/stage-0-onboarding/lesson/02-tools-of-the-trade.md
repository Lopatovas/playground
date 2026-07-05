## The minimum toolkit

Track 1 builds a full-stack app with **Node.js + Express** on the back end, a **SQL database**, and a **vanilla web frontend** (HTML, CSS, JavaScript — no React in Track 1). Install these tools once; you'll use them every day.

### 1. Git — version control

Git records the history of your project: every change, who made it, and when. It runs entirely on your computer.

```bash
git --version
# git version 2.43.0
```

If that command errors, install Git from [git-scm.com](https://git-scm.com). On macOS you can also run `xcode-select --install`; on most Linux distros `sudo apt install git`.

### 2. GitHub — where your repo lives online

**Git** is the tool. **GitHub** is a website that hosts Git repositories so you can back them up, share them, and let CommitLoop read your activity. Create a free account at [github.com](https://github.com) if you don't have one.

> Remember the distinction: Git is local, GitHub is remote. You `commit` locally and `push` to GitHub.

### 3. Node.js — the JavaScript runtime

Node lets you run JavaScript outside the browser. It powers your Express API and your build tools. Install the **LTS** version from [nodejs.org](https://nodejs.org).

```bash
node --version   # v22.x or similar
npm --version    # comes bundled with Node
```

`npm` is Node's package manager — you'll use it to install libraries like Express.

### 4. A code editor

[VS Code](https://code.visualstudio.com) is the common choice and works great with everything in this track. Any editor you're comfortable in is fine.

### 5. A terminal

The terminal (Terminal on macOS, your shell on Linux, Git Bash or PowerShell on Windows) is where you run Git, Node, and your app. You don't need to be an expert — a handful of commands carry you a long way:

| Command | What it does |
| --- | --- |
| `pwd` | Print the current directory |
| `ls` | List files in the current directory |
| `cd my-folder` | Change into a directory |
| `mkdir my-folder` | Create a new directory |

You'll practice the Git commands hands-on in the Sandbox.

### 6. Chrome DevTools — inspect the frontend

**DevTools** (F12 or right-click → Inspect) is how you debug web pages. Track 1 uses three panels:

| Panel | Use for |
| --- | --- |
| **Elements** | Inspect HTML structure, live-edit CSS, test responsive widths |
| **Console** | Run JavaScript, read errors, log variables |
| **Network** | See API requests the browser makes (`fetch`, form posts) |

You don't need to memorize every tab. The rule is: *when the UI looks wrong or a request fails, open DevTools first.*

### 7. API client — Postman, Insomnia, or Bruno

An **API client** lets you send HTTP requests without a browser. You'll hit your Express endpoints with GET/POST before wiring the frontend.

Popular options (pick one):

- [Postman](https://www.postman.com)
- [Insomnia](https://insomnia.rest)
- [Bruno](https://www.usebruno.com)

`curl` in the terminal works too — same idea, different UI. Stage 4 introduces it formally.

### 8. Database GUI — see what's stored

A **DB GUI** shows tables, rows, and schema visually. After you write SQL in Stage 5, you'll confirm rows landed by re-running `SELECT` in the GUI.

| Tool | Good for |
| --- | --- |
| `sqlite3` CLI | Quick queries from the terminal |
| [DB Browser for SQLite](https://sqlitebrowser.org) | Free, visual SQLite inspector |
| TablePlus / pgAdmin | Heavier GUIs; same workflow on Postgres later |

CLI + GUI is the professional habit: write data in code, **verify in the database tool**.

## Tooling map by layer

| Layer | You build with | You verify with |
| --- | --- | --- |
| Frontend | HTML, CSS, JS in `web/` | DevTools Elements + Console |
| API | Express in `api/` | Postman/curl, then Network tab |
| Database | SQL / ORM | `sqlite3` CLI + DB GUI |
| History | Git commits | `git log`, GitHub |

You'll go deep on Git in Stage 1. For now, get the environment working and know which tool answers *"how do I know this worked?"* at each layer.
