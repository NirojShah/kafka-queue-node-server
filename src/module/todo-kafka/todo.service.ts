import ResponseType from "../../response/response.type.js";
import kafkaProducer from "../../kafka/kafka-producer.js";
import type { TodoType } from "../todo.model.js";

interface TodoService {
  enqueueTodo(todo: TodoType): Promise<ResponseType>;
  enqueueTodos(todos: TodoType[]): Promise<ResponseType>;
}

class TodoServiceImplementation implements TodoService {
  async enqueueTodo(todo: TodoType): Promise<ResponseType> {
    try {
      void kafkaProducer.sendMessage("todo-events", JSON.stringify(todo)).catch((error) => {
        console.error("[KAFKA] Failed to queue todo.", error);
      });

      return new ResponseType(202, "todo queued for processing.", null);
    } catch (error) {
      console.error("[KAFKA] Failed to queue todo.", error);
      return new ResponseType(503, "failed to queue todo.", null);
    }
  }

  async enqueueTodos(todos: TodoType[]): Promise<ResponseType> {
    try {
      for (const todo of todos) {
        void kafkaProducer.sendMessage("todo-events", JSON.stringify(todo)).catch((error) => {
          console.error("[KAFKA] Failed to queue todo.", error);
        });
      }

      return new ResponseType(202, "todos queued for processing.", null);
    } catch (error) {
      console.error("[KAFKA] Failed to queue todos.", error);
      return new ResponseType(503, "failed to queue todos.", null);
    }
  }
}

export default TodoServiceImplementation;
