import { Router } from "express";
import type { Router as RouterType } from "express";
import TodoController from "./todo.controller.js";

const TodoRouter: RouterType = Router();
const controller = new TodoController();

TodoRouter.post("/", (req, res) => controller.postTodo(req, res));
TodoRouter.get("/", (req, res) => controller.getTodos(req, res));

export default TodoRouter;
