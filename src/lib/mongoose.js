import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
const maxPoolSize = Number(process.env.MONGODB_MAX_POOL_SIZE || 100);
const minPoolSize = Number(process.env.MONGODB_MIN_POOL_SIZE || 10);
const serverSelectionTimeoutMS = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000);

if (!uri) {
  throw new Error("Missing MONGODB_URI in environment");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectMongoose() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      maxPoolSize,
      minPoolSize,
      serverSelectionTimeoutMS,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}