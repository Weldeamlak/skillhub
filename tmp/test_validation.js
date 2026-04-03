import { validationResult } from "express-validator";
import { validateCourse } from "../src/middleware/courseValidationMiddleware.js";

async function mockExpress(req) {
    const middleware = validateCourse;
    // Run all validation middle-wares
    for (const mw of middleware) {
        if (typeof mw === 'function') {
            await new Promise(resolve => mw(req, { status: () => ({ json: res => resolve(res) }) }, resolve));
        }
    }
}

async function test() {
    console.log("Test 1: Missing category...");
    const req1 = {
        body: { title: "Title", description: "Desc", price: 10 }
    };
    let res1;
    const middleware = validateCourse;
    
    // Simulate express running the array of middleware
    for (const step of middleware) {
        await new Promise(resolve => {
            step(req1, { status: code => ({ json: data => { res1 = { code, data }; resolve() } }) }, () => resolve());
        });
        if (res1) break;
    }
    
    console.log("Response:", JSON.stringify(res1));
    if (res1 && res1.code === 400 && res1.data.errors.some(e => e.msg === "Category is required.")) {
        console.log("✅ Validation check for category PASSED");
    } else {
        console.log("❌ Validation check for category FAILED");
    }

    console.log("\nTest 2: Valid request with instructor ID...");
    const req2 = {
        body: { title: "Title", description: "Desc", price: 10, category: "Web", instructor: "60d5ecb54f15a3k1a1cfcf4" }
    };
    let res2;
    for (const step of middleware) {
        await new Promise(resolve => {
            step(req2, { status: code => ({ json: data => { res2 = { code, data }; resolve() } }) }, () => resolve());
        });
        if (res2) break;
    }
    
    if (!res2) {
        console.log("✅ Valid request PASSED (no errors returned)");
    } else {
        console.log("❌ Valid request FAILED (errors returned):", JSON.stringify(res2));
    }
}

test();
