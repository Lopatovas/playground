## Same code, different worlds

Your laptop uses `DATABASE_URL=file:./dev.db`. Production might use Postgres on another continent.

The application code reads one variable name. The **host** supplies the right value per environment.
