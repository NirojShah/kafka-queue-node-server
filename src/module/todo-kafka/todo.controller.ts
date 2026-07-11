import type { Request, Response } from "express";
import TodoServiceImplementation from "./todo.service.js";

class TodoController {
  private todoService = new TodoServiceImplementation();

  async handleInsertOne(req: Request, res: Response): Promise<Response> {
    const resp = await this.todoService.enqueueTodo(req.body);
    return res.status(resp.statusCode).json({
      message: resp.message,
      data: resp.data,
    });
  }

  async handleInsertMany(req: Request, res: Response): Promise<Response> {
    const todos = Array.isArray(req.body) ? req.body : [req.body];
    const resp = await this.todoService.enqueueTodos(todos);
    return res.status(resp.statusCode).json({
      message: resp.message,
      data: resp.data,
    });
  }
}

export default TodoController;
