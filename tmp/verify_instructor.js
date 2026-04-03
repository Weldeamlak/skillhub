import mongoose from "mongoose";
import { createCourseService } from "../src/services/courseService.js";
import User from "../src/model/User.js";
import Course from "../src/model/Course.js";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    // 1. Create a mock admin and a mock instructor
    const admin = await User.findOneAndUpdate(
      { email: "admin_test@example.com" },
      { username: "AdminTest", password: "password", role: "admin" },
      { upsert: true, new: true }
    );

    const teacher = await User.findOneAndUpdate(
      { email: "teacher_test@example.com" },
      { username: "TeacherTest", password: "password", role: "instructor" },
      { upsert: true, new: true }
    );

    console.log("Users setup complete");

    // 2. Test Admin creating course for Teacher
    console.log("Test: Admin creating course for Teacher...");
    const courseByAdminForTeacher = await createCourseService(
      {
        title: "Course by Admin for Teacher",
        description: "Desc",
        price: 10,
        category: "Test",
        instructor: teacher._id.toString()
      },
      admin
    );
    console.log("Created Course Instructor ID:", courseByAdminForTeacher.instructor.toString());
    console.log("Expected Instructor ID:", teacher._id.toString());
    
    if (courseByAdminForTeacher.instructor.toString() === teacher._id.toString()) {
      console.log("✅ Admin-assigned instructor test PASSED");
    } else {
      console.log("❌ Admin-assigned instructor test FAILED");
    }

    // 3. Test Instructor creating course (should be self)
    console.log("Test: Instructor creating course for Self...");
    const courseByTeacher = await createCourseService(
      {
        title: "Course by Teacher",
        description: "Desc",
        price: 20,
        category: "Test"
      },
      teacher
    );
    console.log("Created Course Instructor ID:", courseByTeacher.instructor.toString());
    console.log("Expected Instructor ID:", teacher._id.toString());

    if (courseByTeacher.instructor.toString() === teacher._id.toString()) {
      console.log("✅ Instructor self-assign test PASSED");
    } else {
      console.log("❌ Instructor self-assign test FAILED");
    }

    // Cleanup
    await Course.deleteMany({ title: /Course by/ });
    // await User.deleteMany({ email: /_test@example.com/ });
    
    console.log("Cleanup complete");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

test();
