Every endpoint is a **method + path**. The method declares your intent, and getting it right keeps your API predictable.

Map each action for a `workouts` resource to its method:

| Action | Method + path |
| --- | --- |
| List all workouts | `GET /workouts` |
| Get one workout | `GET /workouts/:id` |
| Create a workout | `POST /workouts` |
| Update a workout | `PATCH /workouts/:id` |
| Delete a workout | `DELETE /workouts/:id` |

The key rule: **`GET` never changes data.** Reads are safe and repeatable; anything that creates or mutates uses POST/PUT/PATCH/DELETE.
