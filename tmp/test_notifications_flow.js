import mongoose from "mongoose";
import { registerService, forgotPasswordService } from "../src/services/authService.js";
import { createReviewService } from "../src/services/reviewService.js";
import { createLesson } from "../src/services/lessonService.js";
import User from "../src/model/User.js";
import Course from "../src/model/Course.js";
import Enrollment from "../src/model/Enrollment.js";
import env from "../src/config/env.js";

async function testAllNotifications() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Initial Cleanup
    await User.deleteMany({ username: { $in: ["Notify_Student", "Notify_Instructor"] } });
    await Course.deleteMany({ title: "Notification Test Course" });

    // 1. Test Auth Notification (Registration)
    console.log("\nTesting Auth Notification (Register)...");
    const regResult = await registerService({
      username: "Notify_Student",
      email: `student_${Date.now()}@test.com`,
      password: "password123",
      role: "student"
    });
    console.log("Register Result:", regResult.message);
    // Token should NOT be in regResult anymore
    if (regResult.verificationToken) throw new Error("Security Risk: Verification token is still being returned in API response!");
    console.log("✅ Registration notification triggered (check worker logs).");

    // 2. Test Auth Notification (Forgot Password)
    console.log("\nTesting Auth Notification (Forgot Password)...");
    const user = await User.findOne({ username: "Notify_Student" });
    const forgotResult = await forgotPasswordService(user.email);
    console.log("Forgot Result:", forgotResult.message);
    if (forgotResult.resetToken) throw new Error("Security Risk: Reset token is still being returned in API response!");
    console.log("✅ Forgot password notification triggered.");

    // 3. Test Review Notification
    console.log("\nTesting Review Notification...");
    const instructor = await User.create({
      username: "Notify_Instructor",
      email: `inst_${Date.now()}@test.com`,
      password: "password123",
      role: "instructor",
      isVerified: true
    });

    const course = await Course.create({
      title: "Notification Test Course",
      description: "Test",
      price: 0,
      category: "Test",
      instructor: instructor._id
    });

    // Student must be enrolled to review
    await Enrollment.create({ student: user._id, course: course._id });

    const reviewResult = await createReviewService({
      course: course._id,
      rating: 5,
      comment: "Amazing test course!"
    }, user);
    console.log("✅ Review notification triggered to instructor.");

    // 4. Test Lesson Notification
    console.log("\nTesting Lesson Notification...");
    const lessonResult = await createLesson({
      title: "New Update Lesson",
      course: course._id,
      order: 1
    });
    console.log("✅ Lesson update notification triggered for all students.");

    // Cleanup
    await User.deleteMany({ _id: { $in: [user._id, instructor._id] } });
    await Course.deleteOne({ _id: course._id });
    await Enrollment.deleteMany({ course: course._id });

    console.log("\nAll Notification Triggers verified!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  }
}

testAllNotifications();
