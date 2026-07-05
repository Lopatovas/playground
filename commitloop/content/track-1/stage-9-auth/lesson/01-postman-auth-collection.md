## Prove auth in Postman before touching the UI

Stage 9 is **backend-only**. You will add register, login, refresh, and `/me` endpoints and verify them with an API client — the same workflow professionals use before wiring a frontend.

## Set up a collection

In Postman, Insomnia, or Bruno:

1. Create a collection named **Auth — Your Project**
2. Set a collection variable `baseUrl` = `http://localhost:3001` (or your API port)
3. Add a folder **Auth flow**

## Requests to add (in order)

| # | Method | Path | Body | Notes |
| --- | --- | --- | --- | --- |
| 1 | POST | `{{baseUrl}}/auth/register` | `{ "email": "test@example.com", "password": "secret123" }` | Expect `201` or `200` + tokens |
| 2 | POST | `{{baseUrl}}/auth/login` | same credentials | Expect tokens |
| 3 | GET | `{{baseUrl}}/me` | — | Header: `Authorization: Bearer {{accessToken}}` |
| 4 | POST | `{{baseUrl}}/auth/refresh` | `{ "refreshToken": "{{refreshToken}}" }` | Expect new access token |

## Save tokens automatically

In Postman, use the **Tests** tab on login/register to save tokens:

```javascript
const body = pm.response.json();
pm.collectionVariables.set("accessToken", body.accessToken);
pm.collectionVariables.set("refreshToken", body.refreshToken);
```

Now `/me` and refresh requests pick up tokens without copy-paste.

## Why Postman first?

- Auth bugs are easier to debug without browser CORS, cookies, and redirect noise
- You lock in the **HTTP contract** before Stage 10's fetch calls
- Same collection becomes regression tests you can share with teammates

Run the full collection after every auth change. Green in Postman → ready for the UI.
