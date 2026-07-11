# Kafa Server (Kafka + MongoDB) with Redis dependency

This repository implements a simple Todo HTTP API with two modes:

- v1: Synchronous MongoDB-backed endpoints (direct create + fetch)
- v2: Asynchronous Kafka-backed enqueue endpoint (produces messages to a Kafka topic; a consumer reads messages and bulk-inserts into MongoDB)

This README explains the project structure, configuration, how to run it, and example requests so anyone can understand and run the project.

**Repository**
- Source entry: [app.ts](app.ts)
- Server bootstrap: [server.ts](server.ts)
- Environment helpers: [src/utility/env.config.ts](src/utility/env.config.ts)
- Database connection: [src/utility/connectDb.ts](src/utility/connectDb.ts)
- Kafka connection & clients: [src/kafka/kafka-connection.ts](src/kafka/kafka-connection.ts), [src/kafka/kafka-producer.ts](src/kafka/kafka-producer.ts), [src/kafka/kafka-consumer.ts](src/kafka/kafka-consumer.ts)
- Todo module (API + model): [src/module](src/module)

Project files of interest:

- [src/utility/.env.example](src/utility/.env.example) — example of environment variables used by the app.
- [autocannon-load-testing.md](autocannon-load-testing.md) — load-testing notes (optional).

Project overview
----------------

This app is an Express + TypeScript project that stores todo items in MongoDB and optionally queues todo creation requests to Kafka for asynchronous processing. The Kafka consumer will batch messages and insert them into MongoDB in bulk.

Key behaviors:
- POST /app/v1/todo -> immediately creates a todo document in MongoDB.
- GET /app/v1/todo -> returns all todos (projected fields: `taskName` and `status`).
- POST /app/v2/todo -> enqueues a todo to Kafka (topic `todo-events` by default). Returns 202 Accepted.

Important notes about implementation
----------------------------------
- MongoDB: used via `mongoose` in [src/utility/connectDb.ts](src/utility/connectDb.ts).
- The MongoDB connection in `src/utility/connectDb.ts` sets `maxPoolSize: 1` and `minPoolSize: 1` (a single connection in the pool). This means the app uses one pooled connection for requests.
- `waitQueueTimeoutMS: 1000` is configured so when all pooled connections are busy the driver will wait up to 1000ms (1 second) for a connection to become free before failing the operation.
- Kafka: implemented with `kafkajs`. Producer is in [src/kafka/kafka-producer.ts](src/kafka/kafka-producer.ts) and consumer in [src/kafka/kafka-consumer.ts](src/kafka/kafka-consumer.ts).
- Environment files: the project expects environment configuration files under `src/utility` (example: `.env.dev`, `.env.prod`, `.env.testing`). See [src/utility/.env.example](src/utility/.env.example).
- Redis: the `redis` package is present in `package.json` but there is no runtime usage in the source files in this repo. If you intend to use Redis, wiring code will be required.

Configuration / Environment
---------------------------

Copy or adapt the example file for the environment you want to run (dev, prod, test). Example variables (see [src/utility/.env.example](src/utility/.env.example)):

- `PORT` — HTTP port (if not set the server uses `7070` default in [server.ts](server.ts)).
- `NODE_ENV` — environment (dev|prod|test). The app loads `src/utility/.env.<env>` using the helper.
- `DB_HOST`, `DB_PORT`, `DB_NAME` — MongoDB connection settings.
- `KAFKA_HOST` — broker address (example: `localhost:9092` in `.env.example`). Note: the actual broker list is currently hard-coded in [src/kafka/kafka-connection.ts](src/kafka/kafka-connection.ts); update that file to change brokers programmatically.
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB` — present in `.env.example` but unused by the current code.

Running the project (development)
---------------------------------

Prerequisites:

- Node.js (recommended v18+)
- npm or yarn
- A running MongoDB instance accessible by `DB_HOST`:`DB_PORT`.
- A running Kafka broker available at `localhost:9092` (or update [src/kafka/kafka-connection.ts](src/kafka/kafka-connection.ts) to point to your broker).

Install dependencies:

```bash
npm install
```

Start in development (fast reload):

```bash
npm run dev
```

Or start using the `start` script (uses `tsx watch` defined in `package.json`):

```bash
npm run start
```

Build for production (transpile TypeScript):

```bash
npm run build
# then run the compiled output, e.g.:
node dist/server.js
```

How the server starts
---------------------

The server bootstrap is in [server.ts](server.ts). It:

- loads environment configuration via `src/utility/env.config.ts` (the file is chosen based on `NODE_ENV`).
- connects to MongoDB using `connectDatabase(DB_PORT, DB_HOST, DB_NAME)`.
- starts Kafka producer and consumer (producer connects and the consumer subscribes to the configured topic). The default topic used by the consumer/producer is `todo-events` (see [server.ts](server.ts)).
- starts the HTTP server on `PORT` (fallback `7070`)

API: Endpoints and request examples
----------------------------------

1) Create todo synchronously (direct to Mongo)

- Endpoint: POST /app/v1/todo
- Body (JSON):

```json
{
  "taskName": "Buy milk",
  "status": "pending"
}
```

Example curl:

```bash
curl -X POST http://localhost:7070/app/v1/todo \
  -H "Content-Type: application/json" \
  -d '{"taskName":"Buy milk","status":"pending"}'
```

2) Get todos

- Endpoint: GET /app/v1/todo

```bash
curl http://localhost:7070/app/v1/todo
```

3) Enqueue todo (Kafka-based async)

- Endpoint: POST /app/v2/todo
- Behavior: The HTTP handler sends the todo to the Kafka topic `todo-events`. The consumer reads messages and bulk-inserts into MongoDB.

Example curl:

```bash
curl -X POST http://localhost:7070/app/v2/todo \
  -H "Content-Type: application/json" \
  -d '{"taskName":"Send report","status":"pending"}'
```

Internals: Kafka consumer behavior
---------------------------------

- The consumer in [src/kafka/kafka-consumer.ts](src/kafka/kafka-consumer.ts) subscribes to the configured topic and buffers incoming messages.
- It flushes a buffer either when the buffer reaches a maximum batch size (500) or after `flushIntervalMs` (1000ms) using a timer.
- When flushing, the consumer calls `Todo.insertMany(batch, { ordered: false })` to insert many docs at once, which improves throughput.

Extending / Modifying
---------------------

- To change Kafka brokers dynamically, update [src/kafka/kafka-connection.ts](src/kafka/kafka-connection.ts) to read environment variables instead of the current hard-coded brokers list.
- Redis is not wired into the codebase — if you need caching or rate-limiting, add a Redis client and use the `REDIS_*` env vars provided in the `.env.example`.
- The code uses `kafkajs` and `mongoose`; adjust options in `kafka-producer.ts` and `connectDb.ts` for production readiness (auth, TLS, connection pools).

Troubleshooting
---------------

- If the Kafka consumer logs errors about connecting, ensure Kafka broker(s) are reachable at the address in `src/kafka/kafka-connection.ts`.
- If Mongo fails to connect, verify `DB_HOST`, `DB_PORT`, and that `mongod` is running and accessible.
- The app prints HTTP errors for non-2xx responses to the console via the Express middleware in [app.ts](app.ts).

Files to review for implementation details
-----------------------------------------
- [app.ts](app.ts)
- [server.ts](server.ts)
- [src/utility/env.config.ts](src/utility/env.config.ts)
- [src/kafka/kafka-consumer.ts](src/kafka/kafka-consumer.ts)
- [src/kafka/kafka-producer.ts](src/kafka/kafka-producer.ts)
- [src/module/todo-kafka/todo.service.ts](src/module/todo-kafka/todo.service.ts)

Next steps and recommendations
------------------------------

- If you want a production-ready deployment, consider:
  - Externalizing Kafka broker list and credentials via env vars.
  - Adding health-check endpoints and graceful shutdown to flush buffers and disconnect Kafka/Mongo clients.
  - Adding request validation (e.g., `zod` or `joi`) to validate todo payloads.
  - Removing unused dependencies (e.g., `redis`) or wiring them if required.

If you'd like, I can:
- Add a health-check endpoint and graceful shutdown.
- Replace the hard-coded Kafka broker with environment-driven configuration.
- Add request validation and example tests.

Load testing (autocannon) results
---------------------------------

The following load test was run with `autocannon` from the project machine. Two tests were executed:

- v1 endpoint: synchronous MongoDB writes (`POST /app/v1/todo`)
- v2 endpoint: Kafka enqueue (`POST /app/v2/todo`)

Command used (example):

```bash
npx autocannon -m POST -H "Content-Type: application/json" -b '{"taskName":"Buy milk","status":"pending"}' -c 1500 -d 15 http://127.0.0.1:5000/app/v1/todo
```

Summary (v1: /app/v1/todo)

Running 15s test @ http://127.0.0.1:5000/app/v1/todo
1500 connections

Latency (ms): 2.5% 1078 | 50% 1245 | 97.5% 1660 | 99% 1882 | Avg 1255.15 | Max 2085

Req/sec: 1% 331 | 50% 1212 | 97.5% 1347 | Avg 1146.94 | Min 331

Totals: 19k requests in 15.2s — 6730 2xx responses, 10474 non-2xx responses

Summary (v2: /app/v2/todo)

Running 15s test @ http://127.0.0.1:5000/app/v2/todo
1500 connections

Latency (ms): 2.5% 2 | 50% 365 | 97.5% 507 | 99% 687 | Avg 309.39 | Max 820

Req/sec: 1% 2633 | 50% 4931 | 97.5% 5211 | Avg 4790.47 | Min 2633

Totals: 73k requests in 15.18s — 23.4 MB read

Notes and interpretation
------------------------
- The v1 endpoint (direct MongoDB writes) exhibited much higher latency and many non-2xx responses under this load — likely due to Mongo connection or write bottlenecks.
- The v2 endpoint (enqueue to Kafka) achieved significantly higher throughput and lower average latency because the HTTP handler returns quickly after producing to Kafka; bulk inserts are handled asynchronously by the consumer.
- Use these results as a baseline. Before drawing conclusions, ensure the environment is stable (single-run variance), confirm broker and DB health during tests, and consider running multiple iterations.

