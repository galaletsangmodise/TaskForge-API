# TaskForge API

A small Express + Node.js task API built across 4 stages: routing/middleware, async programming, RESTful persistence + static files, and centralized error handling.

## Setup

```bash
npm install
npm start        # or: npm run dev  (auto-restarts on changes)
```

Server runs at `http://localhost:3000`. Visit that URL in a browser to see the static frontend, or hit the API directly.

## Routes

| Method | Path                | Description                          | Success | Failure       |
|--------|---------------------|---------------------------------------|---------|---------------|
| GET    | `/tasks`             | List all tasks                        | 200     | —             |
| GET    | `/tasks/:id`          | Get one task                          | 200     | 404           |
| GET    | `/tasks/:id/verify`   | Simulated async check (1.5s delay)    | 200     | 400 / 404     |
| POST   | `/tasks`              | Create a task (`title` required)      | 201     | 400           |
| PUT    | `/tasks/:id`          | Update a task                         | 200     | 400 / 404     |
| DELETE | `/tasks/:id`          | Delete a task                         | 204     | 404           |

## Data

Tasks persist in `data/tasks.json`, read/written via `fs.promises`. Restarting the server does not lose data. The seed data includes one task with a missing `title` on purpose, use it to test the `/verify` error path:

```bash
curl http://localhost:3000/tasks/t0004dddd/verify
```

## Error handling

Every route wraps its logic in try/catch and calls `next(err)` on failure — no route sends its own error response. All errors resolve through the single middleware in `middleware/errorHandler.js`, registered last in `server.js`. It never leaks stack traces to the client.

## Why async/await for `/verify`

The verify check simulates a real network/database call, something with latency that shouldn't block the event loop. `async/await` reads top-to-bottom like synchronous code while still yielding control during the wait, so the server can keep handling other requests concurrently. It also lets a single `try/catch` catch both the simulated-delay logic and any downstream errors, which is messier to express correctly with chained `.then()`/`.catch()`.

## Testing

Use Postman, Thunder Client, or curl. Example:

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Write tests"}'
curl http://localhost:3000/tasks
curl -X PUT http://localhost:3000/tasks/<id> -H "Content-Type: application/json" -d '{"completed":true}'
curl -X DELETE http://localhost:3000/tasks/<id>
```