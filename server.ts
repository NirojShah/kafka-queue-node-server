import { createServer } from "node:http";
import type { Server } from "node:http";
import app from "./app.js";
import connectDatabase from "./src/utility/connectDb.js";
import kafkaConsumer from "./src/kafka/kafka-consumer.js";
import kafkaProducer from "./src/kafka/kafka-producer.js";

const PORT: number = Number(process.env.PORT) || 7070;
const server: Server = createServer(app);

server.on("error", (err: Error) => {
  console.error(err.message);
});

const DB_HOST: string = process.env.DB_HOST || "localhost";
const DB_PORT: number = Number(process.env.DB_PORT) || 27017;
const DB_NAME: string = process.env.DB_NAME || "kafkadb1";
const KAFKA_TOPIC: string = process.env.KAFKA_TOPIC || "todo-events";

connectDatabase(DB_PORT, DB_HOST, DB_NAME);

const startKafka = async (): Promise<void> => {
  try {
    await kafkaProducer.connectProducer();
    await kafkaConsumer.connectConsumer(KAFKA_TOPIC);
  } catch (error) {
    console.error("[KAFKA] startup failed.", error);
  }
};

void startKafka();

server.listen(PORT, () => {
  console.log(`[ SERVER ] running in PORT - ${PORT}`);
});
