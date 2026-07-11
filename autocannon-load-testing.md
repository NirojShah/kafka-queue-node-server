# Load Testing with autocannon

## Install (project-local)

``` bash
npm install --save-dev autocannon
```

Run with `npx` so a global install is not required.

## GET request

``` bash
npx autocannon -c 500 -d 30 http://127.0.0.1:5000/app/v1/todo
```

Increase concurrency:

``` bash
npx autocannon -c 1000 -d 30 http://127.0.0.1:5000/app/v1/todo
```

## POST request with JSON body

``` bash
npx autocannon \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"taskName":"Buy milk","status":"pending"}' \
  -c 500 \
  -d 30 \
  http://127.0.0.1:5000/app/v1/todo
```

Example with higher concurrency:

``` bash
npx autocannon \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"taskName":"Buy milk","status":"pending"}' \
  -c 5000 \
  -d 30 \
  http://127.0.0.1:5000/app/v1/todo
```

## Understanding the output

-   **Latency**: Time taken for requests to complete.
-   **Req/Sec**: Average requests processed per second.
-   **2xx responses**: Successful requests.
-   **non-2xx responses**: Failed requests (4xx/5xx).
-   **Timeout while checking out a connection from connection pool**:
    The MongoDB driver could not obtain a connection within the
    configured wait time.

## Tips

-   Run the benchmark against `127.0.0.1` to remove network overhead.

-   Increase concurrency gradually (100, 250, 500, 1000, 2000, 5000).

-   Monitor your application with:

    ``` bash
    pm2 logs --lines 100
    pm2 monit
    ```

-   Monitor MongoDB while testing to observe connection pool behavior.
