## Never concatenate user input into SQL

Malicious input like `'); DROP TABLE workouts;--` can destroy data if you build SQL with template strings. Use `?` placeholders.
