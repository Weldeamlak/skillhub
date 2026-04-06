import mongoose from "mongoose";
import { initiateChapaTransaction, verifyChapaTransaction } from "../src/services/paymentService.js";
import User from "../src/model/User.js";
import Course from "../src/model/Course.js";
import Payment from "../src/model/Payment.js";
import Enrollment from "../src/model/Enrollment.js";
import Progress from "../src/model/Progress.js";
import Lesson from "../src/model/Lesson.js";
import env from "../src/config/env.js";

// Mock mongoose.startSession for standalone mongo (local dev)
mongoose.startSession = async () => ({
  withTransaction: async (fn) => fn(),
  endSession: () => {},
  inTransaction: () => false,
  client: { s: { options: {} } }
});

async function testPaymentFlow() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Initial Cleanup
    await User.deleteMany({ username: { $in: ["Student_Test", "Instructor_Test"] } });
    await Course.deleteMany({ title: "Test Automation Course" });

    // 1. Setup Mock User, Course, and Lesson
    const student = await User.create({
      username: "Student_Test",
      email: `student_${Date.now()}@example.com`,
      password: "password123",
      role: "student",
      isVerified: true
    });

    const instructor = await User.create({
      username: "Instructor_Test",
      email: `instructor_${Date.now()}@example.com`,
      password: "password123",
      role: "instructor",
      isVerified: true
    });

    const course = await Course.create({
      title: "Test Automation Course",
      description: "Learn how to automate tests",
      price: 1000,
      category: "Programming",
      instructor: instructor._id,
      status: "published"
    });

    const lesson = await Lesson.create({
      title: "Lesson 1: Introduction",
      course: course._id,
      order: 1
    });

    console.log("Setup complete (User, Course, Lesson).");

    // 2. Initiate Payment (Mocking Chapa call by ignoring the fetch part or mocking env)
    // Actually, we'll just create a pending payment manually to test the verification part
    const tx_ref = `test_tx_${Date.now()}`;
    const payment = await Payment.create({
      user: student._id,
      course: course._id,
      tx_ref,
      amount: 1000,
      status: "pending",
      type: "one-time"
    });

    console.log(`Manual pending payment created: ${tx_ref}`);

    // 3. Mock verifyChapaTransaction
    // We can't really call the real Chapa API in a test script without real keys
    // So we'll monkey-patch the global fetch just for this test
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        status: "success",
        data: {
          status: "success",
          amount: 1000,
          tx_ref
        }
      })
    });

    console.log("Verifying transaction...");
    const result = await verifyChapaTransaction(tx_ref);
    console.log("Verification Result Status:", result.payment.status);

    // 4. Verify Side Effects
    // Check Enrollment
    const enrollment = await Enrollment.findOne({ student: student._id, course: course._id });
    if (enrollment) console.log("✅ Enrollment created successfully.");
    else throw new Error("Enrollment not found!");

    // Check Progress
    const progress = await Progress.find({ user: student._id, course: course._id });
    const unlockedLesson = progress.find(p => p.status === "unlocked");
    if (unlockedLesson) console.log("✅ Progress initialized and Lesson 1 unlocked.");
    else throw new Error("Progress not initialized correctly!");

    // Check Instructor Earnings
    const updatedInstructor = await User.findById(instructor._id);
    console.log("Instructor Earnings:", updatedInstructor.earnings);
    if (updatedInstructor.earnings === 800) console.log("✅ Instructor earnings credited correctly (80% split).");
    else throw new Error(`Instructor earnings mismatch! Expected 800, got ${updatedInstructor.earnings}`);

    // Cleanup
    await User.deleteMany({ _id: { $in: [student._id, instructor._id] } });
    await Course.deleteOne({ _id: course._id });
    await Lesson.deleteOne({ _id: lesson._id });
    await Payment.deleteOne({ _id: payment._id });
    await Enrollment.deleteOne({ _id: enrollment._id });
    await Progress.deleteMany({ user: student._id });

    console.log("\nAll Payment Flow tests passed successfully!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  }
}

testPaymentFlow();
