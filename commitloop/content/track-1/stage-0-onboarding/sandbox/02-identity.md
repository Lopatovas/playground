Git stamps every commit with an author name and email. Set them once, globally, so all your repositories use the same identity.

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Use the **same email** as your GitHub account so your commits link to your profile.

Check what's configured:

```bash
git config --global --list
```

This identity is metadata only — it labels your commits. It is **not** how you log into GitHub (that's handled separately when you push).
