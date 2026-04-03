import { registerService, loginService, verifyEmailService } from "../src/services/authService.js";
import mongoose from "mongoose";
import env from "../src/config/env.js";
import User from "../src/model/User.js";

async function testVerification() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB for tests.\n");

    await User.deleteMany({ email: "verifytest@example.com" });

    let verificationToken;

    // 1. Register User
    console.log("Test 1: Register User...");
    const regRes = await registerService({
      username: "VerifyTest",
      email: "verifytest@example.com",
      password: "password123",
      role: "student"
    });
    console.log("Registration Response:", regRes.message);
    verificationToken = regRes.verificationToken;
    if (verificationToken) {
      console.log("✅ Registration passed and token received.");
    } else {
      throw new Error("No verification token received during registration!");
    }

    // 2. Attempt Login (Should fail)
    console.log("\nTest 2: Attempt Login (Should fail)...");
    try {
      await loginService({ email: "verifytest@example.com", password: "password123" });
      console.error("❌ Login succeeded unexpectedly. Verification check failed!");
      process.exit(1);
    } catch (e) {
      if (e.message.includes("Please verify your email address")) {
        console.log("✅ Login blocked appropriately: ", e.message);
      } else {
        throw e;
      }
    }

    // 3. Verify Email
    console.log("\nTest 3: Verify Email...");
    const verifRes = await verifyEmailService(verificationToken);
    console.log("Verification Response:", verifRes.message);
    console.log("✅ Verification passed.");

    // 4. Attempt Login Again (Should succeed)
    console.log("\nTest 4: Attempt Login (Should succeed)...");
    const loginRes = await loginService({ email: "verifytest@example.com", password: "password123" });
    if (loginRes.accessToken) {
      console.log("✅ Login succeeded!");
    } else {
      console.error("❌ Login failed after verification!");
    }

    // Cleanup
    await User.deleteMany({ email: "verifytest@example.com" });
    console.log("\nAll tests passed successfully.");
    process.exit(0);

  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  }
}

testVerification();
