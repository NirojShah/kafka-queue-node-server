import kafka from "./kafka-connection.js";
import type { Producer } from "kafkajs";

class KafkaService {
  private producer: Producer | null = null;

  async connectProducer(): Promise<void> {
    if (this.producer) return;

    this.producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
      idempotent: false,
      maxInFlightRequests: 5,
      retry: {
        retries: 5,
        initialRetryTime: 100,
        maxRetryTime: 3000,
      },
    });

    await this.producer.connect();
    console.log("Producer connected.");
  }

  async sendMessage(topic: string, message: string): Promise<void> {
    if (!this.producer) {
      await this.connectProducer();
    }

    await this.producer!.send({
      topic,
      messages: [{ value: message }],
      timeout: 10000,
    });
  }

  async disconnectProducer(): Promise<void> {
    if (!this.producer) return;

    await this.producer.disconnect();
    this.producer = null;
  }
}

const kafkaProducer = new KafkaService();
export default kafkaProducer;
