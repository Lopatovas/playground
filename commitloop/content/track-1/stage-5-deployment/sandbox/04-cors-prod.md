## Works on my machine, red in production

Locally: frontend `localhost:3000`, API `localhost:3001` — you configured CORS for that.

After deploy: new origins, same code. Browser blocks the request before your API handler runs.

What's the fix?
