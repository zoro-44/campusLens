const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000/api";
let token = "";
let testStudentHtno = "237R1A0401"; // From our data

async function runTests() {
  console.log("=== STARTING CAMPUSLENS API ENDPOINT TESTS ===");

  try {
    // 1. Health check
    console.log("\n1. Testing Server Health...");
    const healthRes = await fetch("http://localhost:3000/health");
    console.log(`Status: ${healthRes.status}`);
    const healthJson = await healthRes.json();
    console.log("Health Check Response:", healthJson);

    // 2. Unauthenticated access check (should fail)
    console.log("\n2. Testing Unauthorized Access (should return 401)...");
    const unauthRes = await fetch(`${BASE_URL}/students`);
    console.log(`Status: ${unauthRes.status} (Expected: 401)`);
    const unauthJson = await unauthRes.json();
    console.log("Response:", unauthJson);

    // 3. Admin Login (get token)
    console.log("\n3. Testing Admin Login...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" })
    });
    console.log(`Status: ${loginRes.status}`);
    const loginJson = await loginRes.json();
    console.log("Login Success:", loginJson.success);
    if (loginJson.success) {
      token = loginJson.token;
      console.log("JWT Token acquired successfully");
    } else {
      throw new Error("Login failed!");
    }

    const authHeaders = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    // 4. GET /api/students: paginated list
    console.log("\n4. Testing GET /api/students (authenticated)...");
    const studentsRes = await fetch(`${BASE_URL}/students?page=1&limit=5`, { headers: authHeaders });
    console.log(`Status: ${studentsRes.status}`);
    const studentsJson = await studentsRes.json();
    console.log("Total Students found:", studentsJson.total);
    console.log("Returned count on page:", studentsJson.students.length);
    console.log("First Student basic details:", studentsJson.students[0]);

    // 5. GET /api/students with filters (branch & gender)
    console.log("\n5. Testing GET /api/students?branch=ECE&gender=M...");
    const filterRes = await fetch(`${BASE_URL}/students?branch=ECE&gender=M&limit=2`, { headers: authHeaders });
    console.log(`Status: ${filterRes.status}`);
    const filterJson = await filterRes.json();
    console.log("Total ECE Male Students:", filterJson.total);
    if (filterJson.students.length > 0) {
      console.log("Sample Student:", filterJson.students[0]);
      testStudentHtno = filterJson.students[0].htno;
    }

    // 6. GET /api/students/:htno (Full nested profile)
    console.log(`\n6. Testing GET /api/students/${testStudentHtno} (Full nested profile)...`);
    const profileRes = await fetch(`${BASE_URL}/students/${testStudentHtno}`, { headers: authHeaders });
    console.log(`Status: ${profileRes.status}`);
    const profileJson = await profileRes.json();
    console.log("Profile structure categories present:");
    console.log("- Personal:", !!profileJson.data.personal);
    console.log("- Contact:", !!profileJson.data.contact);
    console.log("- Parents:", !!profileJson.data.parents);
    console.log("- Address:", !!profileJson.data.address);
    console.log("- Academic:", !!profileJson.data.academic);
    console.log("- Category Info:", !!profileJson.data.category_info);
    console.log("- Identification:", !!profileJson.data.identification);
    console.log("Personal Email:", profileJson.data.personal.email);

    // 7. PUT /api/students/:htno (Partial update)
    console.log(`\n7. Testing PUT /api/students/${testStudentHtno} (Partial update)...`);
    const originalEmail = profileJson.data.personal.email;
    const testEmail = "test_updated_email@cmrtc.ac.in";
    
    const updateRes = await fetch(`${BASE_URL}/students/${testStudentHtno}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        personal: { email: testEmail },
        contact: { alternate_mobile: "9988776655" }
      })
    });
    console.log(`Status: ${updateRes.status}`);
    const updateJson = await updateRes.json();
    console.log("Update response:", updateJson);

    // Re-verify the update
    const verifyRes = await fetch(`${BASE_URL}/students/${testStudentHtno}`, { headers: authHeaders });
    const verifyJson = await verifyRes.json();
    console.log("Verify Updated Email:", verifyJson.data.personal.email === testEmail ? "SUCCESS" : "FAILED");
    console.log("Verify Alternate Mobile:", verifyJson.data.contact.alternate_mobile === "9988776655" ? "SUCCESS" : "FAILED");

    // Revert back the email
    await fetch(`${BASE_URL}/students/${testStudentHtno}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        personal: { email: originalEmail }
      })
    });
    console.log("Reverted student email back to original.");

    // 8. GET /api/departments
    console.log("\n8. Testing GET /api/departments...");
    const deptsRes = await fetch(`${BASE_URL}/departments`, { headers: authHeaders });
    console.log(`Status: ${deptsRes.status}`);
    const deptsJson = await deptsRes.json();
    console.log("Departments count:", deptsJson.data.length);
    console.log("Departments list sample:", deptsJson.data.slice(0, 3));

    // 9. GET /api/sections
    console.log("\n9. Testing GET /api/sections (all and filtered)...");
    const secResAll = await fetch(`${BASE_URL}/sections`, { headers: authHeaders });
    const secJsonAll = await secResAll.json();
    console.log("Total sections count:", secJsonAll.data.length);

    const secResFiltered = await fetch(`${BASE_URL}/sections?department_code=5`, { headers: authHeaders });
    const secJsonFiltered = await secResFiltered.json();
    console.log("Sections for department '5' (CSE):", secJsonFiltered.data.length);

    // 10. GET /api/stats/overview
    console.log("\n10. Testing GET /api/stats/overview...");
    const statsRes = await fetch(`${BASE_URL}/stats/overview`, { headers: authHeaders });
    console.log(`Status: ${statsRes.status}`);
    const statsJson = await statsRes.json();
    console.log("Overview statistics:");
    console.log("- Total Students:", statsJson.data.totalStudents);
    console.log("- Branch distribution:", statsJson.data.branchDistribution);
    console.log("- Gender distribution:", statsJson.data.genderDistribution);
    console.log("- Category distribution:", statsJson.data.categoryDistribution);
    console.log("- Admission distribution:", statsJson.data.admissionDistribution);
    console.log("- PH Count:", statsJson.data.phCount);

    // 11. GET /api/students/:htno/idcard (PDF streaming)
    console.log(`\n11. Testing GET /api/students/${testStudentHtno}/idcard (PDF)...`);
    const idcardRes = await fetch(`${BASE_URL}/students/${testStudentHtno}/idcard`, { headers: authHeaders });
    console.log(`Status: ${idcardRes.status}`);
    console.log("Content-Type Header:", idcardRes.headers.get("content-type"));
    const arrayBuffer = await idcardRes.arrayBuffer();
    console.log("PDF size in bytes:", arrayBuffer.byteLength);
    if (arrayBuffer.byteLength > 1000) {
      console.log("PDF stream test: SUCCESS");
    } else {
      throw new Error("PDF too small or corrupted!");
    }

    // 12. GET /api/export (Excel export streaming)
    console.log("\n12. Testing GET /api/export?branch=CSE (Excel)...");
    const exportRes = await fetch(`${BASE_URL}/export?branch=CSE`, { headers: authHeaders });
    console.log(`Status: ${exportRes.status}`);
    console.log("Content-Type Header:", exportRes.headers.get("content-type"));
    const xlsBuffer = await exportRes.arrayBuffer();
    console.log("Excel size in bytes:", xlsBuffer.byteLength);
    if (xlsBuffer.byteLength > 5000) {
      console.log("Excel stream test: SUCCESS");
    } else {
      throw new Error("Excel too small or corrupted!");
    }

    console.log("\n=== ALL API TESTS PASSED SUCCESSFULLY! 🌟 ===");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    process.exit(1);
  }
}

// Small delay to ensure server started
setTimeout(runTests, 1000);
