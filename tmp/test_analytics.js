import mongoose from "mongoose";
import { 
  getSalesTrendService, 
  getCourseRevenueBreakdownService, 
  getGlobalAdminStatsService 
} from "../src/services/analyticsService.js";
import User from "../src/model/User.js";
import Course from "../src/model/Course.js";
import Payment from "../src/model/Payment.js";
import env from "../src/config/env.js";

async function testAnalytics() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Setup Mock Data
    const instructor = await User.create({
      username: "Analytics_Instructor",
      email: `inst_${Date.now()}@test.com`,
      password: "password",
      role: "instructor",
      earnings: 5000
    });

    const admin = await User.create({
      username: "Analytics_Admin",
      email: `admin_${Date.now()}@test.com`,
      password: "password",
      role: "admin"
    });

    const course1 = await Course.create({
      title: "Course A",
      description: "Desc A",
      price: 100,
      category: "Cat A",
      instructor: instructor._id
    });

    const course2 = await Course.create({
      title: "Course B",
      description: "Desc B",
      price: 200,
      category: "Cat B",
      instructor: instructor._id
    });

    // Create payments across different dates
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    await Payment.create([
      { user: admin._id, course: course1._id, amount: 100, status: "success", tx_ref: "t1", type: "one-time", createdAt: today },
      { user: admin._id, course: course1._id, amount: 100, status: "success", tx_ref: "t2", type: "one-time", createdAt: yesterday },
      { user: admin._id, course: course2._id, amount: 200, status: "success", tx_ref: "t3", type: "one-time", createdAt: today }
    ]);

    console.log("Mock data created.");

    // Test 1: Sales Trend
    console.log("\nTesting Sales Trend...");
    const trend = await getSalesTrendService(instructor._id);
    console.log("Trend Result:", trend);
    if (trend.length > 0) console.log("✅ Sales Trend verified.");

    // Test 2: Course Breakdown
    console.log("\nTesting Course Breakdown...");
    const breakdown = await getCourseRevenueBreakdownService(instructor._id);
    console.log("Breakdown Result:", breakdown);
    if (breakdown.length === 2) console.log("✅ Course Breakdown verified.");

    // Test 3: Admin Stats
    console.log("\nTesting Admin Stats...");
    const adminStats = await getGlobalAdminStatsService();
    console.log("Admin Overview:", adminStats.overview);
    if (adminStats.overview.totalRevenue >= 400) console.log("✅ Admin Stats verified.");

    // Cleanup
    await User.deleteMany({ _id: { $in: [instructor._id, admin._id] } });
    await Course.deleteMany({ _id: { $in: [course1._id, course2._id] } });
    await Payment.deleteMany({ tx_ref: { $in: ["t1", "t2", "t3"] } });

    console.log("\nAll Analytics tests passed!");
    process.exit(0);

  } catch (err) {
    console.error("Test Failed:", err);
    process.exit(1);
  }
}

testAnalytics();
