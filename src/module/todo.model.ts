import { model, Schema } from "mongoose";
import type { Model } from "mongoose";

export interface TodoType {
  taskName: string;
  status: "pending" | "completed";
}

const TodoSchema = new Schema<TodoType>({
  status: {
    type: String,
    required: [true, "status is required."],
    enum: ["pending", "completed"],
  },
  taskName: {
    type: String,
    required: [true, "task name is required."],
  },
});

const Todo: Model<TodoType> = model<TodoType>("Todo_C", TodoSchema);

export default Todo;
