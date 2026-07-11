import express from "express";
import type { Express } from "express";
import configureEnv from "./src/utility/env.config.js";
import cors from "cors";
import TodoRouter from "./src/module/todo.route.js";
import type { Request, Response } from "express";
import TodoKafkaRouter from "./src/module/todo-kafka/todo.route.js";

const env: string = process.env.NODE_ENV || "dev";

configureEnv(env);
const app: Express = express();
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      console.log(`${req.method} ${req.url} -> ${res.statusCode}`);
    }
  });

  next();
});

app.use("/app/v1/todo", TodoRouter);
app.use("/app/v2/todo", TodoKafkaRouter);

export default app;
