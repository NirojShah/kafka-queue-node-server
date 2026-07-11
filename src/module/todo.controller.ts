import TodoServiceImplementation from "./todo.service.js";
import type { Request, Response } from "express";

class TodoController {
  private todoService = new TodoServiceImplementation();

  async postTodo(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.todoService.processCreate(req.body);
      return res.status(result.statusCode).json({ message: result.message, data: result.data });
    } catch (err: any) {
      return res.status(500).json({ message: "internal server error", error: err?.message ?? err });
    }
  }

  async getTodos(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.todoService.processGet();
      let data = result.data;
      if (data && typeof (data as any).then === "function") {
        data = await data;
      }
      return res.status(result.statusCode).json({ message: result.message, data });
    } catch (err: any) {
      return res.status(500).json({ message: "internal server error", error: err?.message ?? err });
    }
  }
}

export default TodoController;
