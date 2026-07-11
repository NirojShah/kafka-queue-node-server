import kafka from "./kafka-connection.js";
import Todo, { type TodoType } from "../module/todo.model.js";

class KafkaConsumer {
  private admin = kafka.admin();
  private consumer = kafka.consumer({
    groupId: "group-id-1",
  });

  private buffer: TodoType[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private readonly flushIntervalMs = 1000;
  private readonly maxBatchSize = 500;

  private async ensureTopicExists(topic: string): Promise<void> {
    try {
      await this.admin.connect();
      await this.admin.createTopics({
        topics: [{ topic, numPartitions: 1, replicationFactor: 1 }],
        waitForLeaders: true,
      });
      console.log(`[KAFKA] Topic "${topic}" is ready.`);
    } catch (error: any) {
      if (error?.message?.includes("already exists")) {
        console.log(`[KAFKA] Topic "${topic}" already exists.`);
      } else {
        console.error("[KAFKA] Topic creation failed.", error);
      }
    } finally {
      await this.admin.disconnect();
    }
  }

  async connectConsumer(topic: string): Promise<void> {
    await this.ensureTopicExists(topic);
    await this.consumer.connect();

    await this.consumer.subscribe({
      topic,
      fromBeginning: true,
    });

    console.log(`[KAFKA] Consumer connected to topic "${topic}".`);

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const payload = message.value?.toString();
          if (!payload) return;

          const parsedTodo = JSON.parse(payload) as TodoType;
          this.enqueue(parsedTodo);
        } catch (error) {
          console.error("[KAFKA] Failed to parse message.", error);
        }
      },
    });
  }

  private enqueue(todo: TodoType): void {
    this.buffer.push(todo);

    if (this.buffer.length >= this.maxBatchSize) {
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }
      void this.flushBuffer();
      return;
    }

    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      void this.flushBuffer();
    }, this.flushIntervalMs);
  }

  private async flushBuffer(): Promise<void> {
    this.flushTimer = null;

    if (this.isFlushing || this.buffer.length === 0) {
      if (this.buffer.length > 0 && !this.isFlushing) {
        this.flushTimer = setTimeout(() => {
          void this.flushBuffer();
        }, this.flushIntervalMs);
      }
      return;
    }

    this.isFlushing = true;
    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      await Todo.insertMany(batch, { ordered: false });
      console.log(`[KAFKA] Bulk inserted ${batch.length} records.`);
    } catch (error) {
      console.error("[KAFKA] Bulk insert failed.", error);
    } finally {
      this.isFlushing = false;

      if (this.buffer.length > 0) {
        this.flushTimer = setTimeout(() => {
          void this.flushBuffer();
        }, this.flushIntervalMs);
      }
    }
  }
}

const kafkaConsumer = new KafkaConsumer();
export default kafkaConsumer;
