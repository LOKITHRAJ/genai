import fs from 'fs';
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'graphql-api',
  brokers: ['your-kafka-broker:9093'], // Port usually changes for SSL
  ssl: {
    rejectUnauthorized: true, // Set to false if using self-signed certs
    ca: [fs.readFileSync('/path/to/ca.crt', 'utf-8')],
    key: fs.readFileSync('/path/to/client.key', 'utf-8'),
    cert: fs.readFileSync('/path/to/client.crt', 'utf-8'),
  },
});


const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'graphql-group' });https://github.com/LOKITHRAJ/genai/tree/main

const messages = [];

// ✅ Define only once
async function connectProducerWithRetry(retries = 5, delayMs = 5000) {
  let attempt = 0;

  if (producer.isConnected && producer.isConnected()) {
    console.log("⚠️ Kafka producer is already connected");
    return;
  }

  while (attempt < retries) {
    try {
      await producer.connect();
      console.log(`[${new Date().toISOString()}] ✅ Kafka producer connected`);
      return;
    } catch (err) {
      attempt++;
      console.error(
        `[${new Date().toISOString()}] ❌ Kafka producer connection failed (attempt ${attempt}/${retries}): ${err.message}`
      );
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }

  throw new Error("❌ Kafka producer connection failed after all retries.");
}

// ✅ No duplicate function or export
const startConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'messages', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const msg = message.value.toString();
        console.log(`📥 Received: ${msg}`);
        messages.push(msg);
      },
    });

    console.log("🟢 Kafka consumer started");
  } catch (err) {
    console.error("❌ Error starting Kafka consumer:", err.message);
  }
};

export {
  kafka,
  producer,
  consumer,
  messages,
  startConsumer,
  connectProducerWithRetry,
};
