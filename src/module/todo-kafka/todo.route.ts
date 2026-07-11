import { Router } from "express";
import type { Router as RouterType } from "express";
import TodoController from "./todo.controller.js";

const TodoKafkaRouter: Router = Router();

const todoController = new TodoController();

// TodoKafkaRouter.post("/bulk", async (req, res) =>
//   todoController.handleInsertMany(req, res),
// );

TodoKafkaRouter.post("/", (req, res) =>
  todoController.handleInsertOne(req, res),
);

export default TodoKafkaRouter;
