import { Kafka } from "kafkajs";
import type { Kafka as KafkaType } from "kafkajs";

const kafka: KafkaType = new Kafka({
  clientId: "node-ts-app",
  brokers: ["localhost:9092"],
});

export default kafka;
