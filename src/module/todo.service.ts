import ResponseType from "../response/response.type.js";
import Todo, { TodoType } from "./todo.model.js";

interface TodoService {
  processCreate(todoData: TodoType): Promise<ResponseType>;
  processGet(): Promise<ResponseType>;
}

class TodoServiceImplementation implements TodoService {
  private todoModel = Todo;
  async processCreate(todoData: TodoType): Promise<ResponseType> {
    try {
      await this.todoModel.create(todoData);
      return new ResponseType(200, "successfull inserted.", null);
    } catch (err: unknown) {
      if (err instanceof Error) console.log(err.message);
      else console.log(err);
      return new ResponseType(503, "successfull inserted.", null);
    }
  }
  async processGet(): Promise<ResponseType> {
    const todo = this.todoModel.aggregate([
      {
        $project: {
          taskName: 1,
          status: 1,
          _id: 0,
        },
      },
    ]);
    return new ResponseType(200, "successfully fetched.", todo);
  }
}

export default TodoServiceImplementation;
