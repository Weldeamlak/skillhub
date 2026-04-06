import mongoose from "mongoose";
import { getCourseByIdService, createCourseService } from "../src/services/courseService.js";
import User from "../src/model/User.js";
import Course from "../src/model/Course.js";
import env from "../src/config/env.js";
import { connectRedis } from "../src/config/redis.js";

async function testPerformance() {
  try {
    const redisAvailable = await connectRedis();
    if (!redisAvailable) {
      console.log("❌ Redis is not available. Performance test cannot proceed.");
      process.exit(1);
    }

    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Setup Mock Course
    const instructor = await User.create({
      username: "Perf_Instructor",
      email: `perf_${Date.now()}@test.com`,
      password: "password123",
      role: "instructor",
      isVerified: true
    });

    const course = await createCourseService({
      title: "Performance Test Course",
      description: "Testing Redis Caching Speed",
      price: 50,
      category: "Tech"
    }, instructor);

    const courseId = course._id;
    console.log(`Created course: ${courseId}`);

    // --- MEASURE 1: DB LOOKUP (First hit, No Cache) ---
    console.log("\nHit 1: Cold Cache (MongoDB)...");
    const start1 = performance.now();
    await getCourseByIdService(courseId);
    const end1 = performance.now();
    console.log(`Time taken: ${(end1 - start1).toFixed(2)}ms`);

    // --- MEASURE 2: REDIS LOOKUP (Second hit) ---
    console.log("\nHit 2: Warm Cache (Redis)...");
    const start2 = performance.now();
    await getCourseByIdService(courseId);
    const end2 = performance.now();
    console.log(`Time taken: ${(end2 - start2).toFixed(2)}ms`);

    const speedup = ((end1 - start1) / (end2 - start2)).toFixed(1);
    console.log(`\n🚀 Cache Speedup: ${speedup}x faster`);

    // Cleanup
    await User.deleteOne({ _id: instructor._id });
    await Course.deleteOne({ _id: courseId });

    console.log("\nPerformance Test Complete!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  }
}

testPerformance();
