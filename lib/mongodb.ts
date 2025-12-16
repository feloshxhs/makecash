import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://rumman:rumman@cluster0.h6zl6r5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(MONGODB_URI, {
    dbName: "kucoin", // or your preferred db name
  });
}
