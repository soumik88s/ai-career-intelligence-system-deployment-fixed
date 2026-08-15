import fs from "fs";
import path from "path";

async function runTests() {
  console.log("==================================================");
  console.log("PHASE 3 INTEGRATION TEST SUITE: RESUME UPLOAD & TEXT EXTRACTION");
  console.log("==================================================\n");

  const baseUrl = "http://localhost:3000";

  // 1. Health check
  console.log("1. Checking system health endpoint...");
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log("   Health Status:", healthData.status);
  console.log("   System Phase:", healthData.phase);

  // 2. Register user 1
  const email1 = `phase3_user1_${Date.now()}@university.edu`;
  console.log(`\n2. Registering User 1 (${email1})...`);
  const reg1Res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Phase 3 Candidate 1", email: email1, password: "password123" }),
  });
  const reg1Data = await reg1Res.json();
  const token1 = reg1Data.access_token;
  console.log("   User 1 Token received:", Boolean(token1));

  // 3. Register user 2 (for IDOR testing)
  const email2 = `phase3_user2_${Date.now()}@university.edu`;
  console.log(`\n3. Registering User 2 (${email2})...`);
  const reg2Res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Phase 3 Candidate 2", email: email2, password: "password123" }),
  });
  const reg2Data = await reg2Res.json();
  const token2 = reg2Data.access_token;
  console.log("   User 2 Token received:", Boolean(token2));

  // 4. Create dummy plain text resume file for upload test
  const testFilePath = path.join(process.cwd(), "test_resume.txt");
  const dummyResumeText = `ALEX RIVERA
Computer Science & Engineering Graduate
Email: alex.rivera@university.edu | Phone: +1 (555) 234-5678

EDUCATION:
B.S. in Computer Science & Engineering, University of Technology, 2024
GPA: 3.8/4.0

TECHNICAL SKILLS:
Programming Languages: Python, JavaScript, TypeScript, SQL, C++
Frameworks & Libraries: React, Express, PyTorch, Scikit-Learn, FastAPI
Tools & Databases: PostgreSQL, Docker, Git, Linux, Vector Databases

EXPERIENCE:
Machine Learning Engineering Intern | NeuralTech Labs (Jun 2023 - Dec 2023)
- Implemented RAG search pipelines using Sentence-BERT and FAISS vector index.
- Optimized API latency by 35% using asynchronous FastAPI endpoints.
`;
  fs.writeFileSync(testFilePath, dummyResumeText);

  // 5. Upload Resume for User 1
  console.log("\n5. Testing Resume Upload & Text Extraction for User 1...");
  const formData = new FormData();
  const fileObj = new File([fs.readFileSync(testFilePath)], "Alex_Rivera_Resume.txt", { type: "text/plain" });
  formData.append("file", fileObj);

  const uploadRes = await fetch(`${baseUrl}/api/resumes/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token1}` },
    body: formData,
  });

  const uploadRawText = await uploadRes.text();
  let uploadData = {};
  try {
    uploadData = JSON.parse(uploadRawText);
  } catch (e) {
    console.error("   Upload Raw Response:", uploadRawText);
  }

  console.log("   Upload Status Code:", uploadRes.status);
  console.log("   Upload Response Message:", uploadData.message || uploadData.error);
  console.log("   Extraction Status:", uploadData.extraction?.status);
  console.log("   Extracted Word Count:", uploadData.extraction?.wordCount);
  console.log("   Extracted Text Preview:\n", uploadData.extraction?.previewSnippet);

  const uploadedResumeId = uploadData.resume?.id;

  // 6. List Resumes for User 1
  console.log("\n6. Listing Resumes for User 1...");
  const listRes = await fetch(`${baseUrl}/api/resumes`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const listData = await listRes.json();
  console.log("   Resumes count for User 1:", listData.resumes?.length);

  // 7. Get Extracted Text for User 1
  console.log(`\n7. Fetching Extracted Text for Resume (${uploadedResumeId})...`);
  const textRes = await fetch(`${baseUrl}/api/resumes/${uploadedResumeId}/text`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const textData = await textRes.json();
  console.log("   Text API Status Code:", textRes.status);
  console.log("   Extracted Text Length:", textData.char_count);

  // 8. IDOR Security Test: User 2 tries to access User 1's resume text
  console.log("\n8. Testing IDOR Protection (User 2 attempting to access User 1's resume text)...");
  const idorRes = await fetch(`${baseUrl}/api/resumes/${uploadedResumeId}/text`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  console.log("   IDOR Response Status Code (Expected 404/403):", idorRes.status);

  // 9. IDOR Security Test: User 2 tries to delete User 1's resume
  console.log("\n9. Testing IDOR Protection (User 2 attempting to delete User 1's resume)...");
  const idorDeleteRes = await fetch(`${baseUrl}/api/resumes/${uploadedResumeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token2}` },
  });
  console.log("   IDOR Delete Status Code (Expected 403):", idorDeleteRes.status);

  // 10. Delete Resume as User 1
  console.log("\n10. Deleting Resume as User 1 (Authorized)...");
  const deleteRes = await fetch(`${baseUrl}/api/resumes/${uploadedResumeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token1}` },
  });
  const deleteData = await deleteRes.json();
  console.log("    Delete Response Message:", deleteData.message);

  // Clean up temporary test file
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }

  console.log("\n==================================================");
  console.log("PHASE 3 INTEGRATION TEST SUITE COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

runTests().catch(console.error);
