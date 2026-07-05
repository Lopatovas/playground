## Forms that talk to the API

Stage 9 proved auth in Postman. Now build the screens users actually type into.

## Register screen

```html
<form id="register-form">
  <label>Email <input type="email" name="email" required /></label>
  <label>Password <input type="password" name="password" minlength="8" required /></label>
  <button type="submit">Create account</button>
  <p id="register-error" class="error hidden"></p>
</form>
```

```javascript
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    showError("register-error", await res.json());
    return;
  }
  const { accessToken, refreshToken } = await res.json();
  saveTokens(accessToken, refreshToken);
  showView("app");
  await loadCurrentUser();
});
```

## Login screen

Same shape — `POST /auth/login`. Link: "No account? Register" toggles views.

## Token storage

```javascript
function saveTokens(access, refresh) {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
}
```

For Track 1, `localStorage` is fine. Production apps sometimes prefer httpOnly cookies — out of scope here.

## UX details that matter

- Disable submit button while request is in flight
- Show API error messages (`400` validation, `401` bad login)
- Clear password field on failed login
- After register, land in the app — don't make them log in again unless your API requires it

## No framework needed

You don't need React state. Variables + DOM updates + `fetch` are enough. If render logic grows, split into functions — same separation hint from Stage 2.
