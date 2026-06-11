## The minimum toolkit

Track 1 builds a full-stack app with **Node.js + Express** on the back end, a **SQL database**, and a **web frontend** (we'll use **React** later in the track). To get there you need five tools. Install them once; you'll use them every day.

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
