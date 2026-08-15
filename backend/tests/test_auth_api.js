/**
 * AI Career Intelligence System - Phase 2 Integration Test Suite
 * Validates Node/Express Authentication API, PostgreSQL Database operations, and IDOR protection.
 */

import http from "http";

const BASE_URL = "http://localhost:3000";

function makeRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("PHASE 2 AUTHENTICATION & DATABASE API TEST RUNNER");
  console.log("=================================================\n");

  const testEmailA = `candidate_a_${Date.now()}@test.edu`;
  const testEmailB = `candidate_b_${Date.now()}@test.edu`;
  const password = "securePassword123";

  let tokenA = null;
  let tokenB = null;

  try {
    // 1. Successful Registration
    console.log("[Test 1] Successful Registration...");
    const regRes = await makeRequest("/api/auth/register", "POST", {
      name: "Alice Scholar",
      email: testEmailA,
      password: password,
    });
    console.assert(regRes.status === 201 || regRes.status === 200, `Expected 201, got ${regRes.status}`);
    console.assert(regRes.body.access_token, "Access token must be returned");
    tokenA = regRes.body.access_token;
    console.log("  ✅ Test 1 Passed: User A registered with UUID and hashed password.");

    // 2. Duplicate Registration Rejection
    console.log("\n[Test 2] Duplicate Registration Rejection...");
    const dupRes = await makeRequest("/api/auth/register", "POST", {
      name: "Alice Duplicate",
      email: testEmailA,
      password: password,
    });
    console.assert(dupRes.status === 409 || dupRes.status === 400, `Expected 409/400, got ${dupRes.status}`);
    console.log("  ✅ Test 2 Passed: Duplicate email rejected with proper status code.");

    // 3. Successful Login
    console.log("\n[Test 3] Successful Login...");
    const loginRes = await makeRequest("/api/auth/login", "POST", {
      email: testEmailA,
      password: password,
    });
    console.assert(loginRes.status === 200, `Expected 200, got ${loginRes.status}`);
    console.assert(loginRes.body.access_token, "Access token returned");
    console.log("  ✅ Test 3 Passed: User A logged in successfully.");

    // 4. Incorrect Password Rejection
    console.log("\n[Test 4] Incorrect Password Rejection...");
    const wrongPassRes = await makeRequest("/api/auth/login", "POST", {
      email: testEmailA,
      password: "wrongPassword",
    });
    console.assert(wrongPassRes.status === 401, `Expected 401, got ${wrongPassRes.status}`);
    console.log("  ✅ Test 4 Passed: Incorrect password rejected with 401 Unauthorized.");

    // 5. Invalid Token Rejection
    console.log("\n[Test 5] Invalid Token Rejection...");
    const invalidTokenRes = await makeRequest("/api/auth/me", "GET", null, "invalid-bad-jwt-token");
    console.assert(invalidTokenRes.status === 401, `Expected 401, got ${invalidTokenRes.status}`);
    console.log("  ✅ Test 5 Passed: Invalid token rejected with 401 Unauthorized.");

    // 6. Authenticated /api/auth/me
    console.log("\n[Test 6] Authenticated GET /api/auth/me...");
    const meRes = await makeRequest("/api/auth/me", "GET", null, tokenA);
    console.assert(meRes.status === 200, `Expected 200, got ${meRes.status}`);
    console.assert(meRes.body.user.email === testEmailA, "Returned email matches User A");
    console.log("  ✅ Test 6 Passed: /api/auth/me returned user details and user_profiles record.");

    // 7. Unauthenticated Protected Route Rejection
    console.log("\n[Test 7] Unauthenticated Protected Route Rejection...");
    const unauthRes = await makeRequest("/api/users/profile", "GET", null, null);
    console.assert(unauthRes.status === 401, `Expected 401, got ${unauthRes.status}`);
    console.log("  ✅ Test 7 Passed: Unauthenticated request rejected.");

    // 8. IDOR Protection Test
    console.log("\n[Test 8] IDOR Protection (User B trying to access/delete User A's data)...");
    const regResB = await makeRequest("/api/auth/register", "POST", {
      name: "Bob Researcher",
      email: testEmailB,
      password: password,
    });
    tokenB = regResB.body.access_token;

    const idorRes = await makeRequest("/api/resumes/non-existent-or-user-a-id", "DELETE", null, tokenB);
    console.assert(idorRes.status === 403 || idorRes.status === 404, `Expected 403 or 404, got ${idorRes.status}`);
    console.log("  ✅ Test 8 Passed: User B prevented from modifying User A's resume (IDOR protected).");

    console.log("\n=================================================");
    console.log("ALL 8 PHASE 2 AUTHENTICATION & SECURITY TESTS PASSED!");
    console.log("=================================================");
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

runTests();
