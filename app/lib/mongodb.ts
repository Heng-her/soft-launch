// lib/mongodb.ts
import "server-only";
import { MongoClient, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Please add your Mongo URI to .env (MONGODB_URI).");
}
const options: MongoClientOptions = {
  tls: true,
  family: 4,
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
};

declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise() {
  const client = new MongoClient(uri, options);
  return client.connect().then((connectedClient) => {
    global._mongoClient = connectedClient;
    return connectedClient;
  });
}

export async function getMongoClient() {
  if (global._mongoClient) return global._mongoClient;

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise().catch((error) => {
      global._mongoClientPromise = undefined;
      throw error;
    });
  }

  return global._mongoClientPromise;
}

export default getMongoClient;
