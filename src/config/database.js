import mongoose from "mongoose";
import env from "./env.js";

const connectDB = async () => {
  try {
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not set");
    }
    // ✅ Fix #22: useNewUrlParser and useUnifiedTopology removed — deprecated since Mongoose 6
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB Connected successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;

