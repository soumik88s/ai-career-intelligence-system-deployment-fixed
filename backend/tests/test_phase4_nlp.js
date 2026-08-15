import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:3000/api";

async function runPhase4Tests() {
  console.log("\n=======================================================");
  console.log("RUNNING PHASE 4 NLP INTELLIGENCE & EXTRACTION INTEGRATION TESTS");
  console.log("=======================================================\n");

  try {
    // 1. Health check
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log("1. Health Check Phase Status:", healthData.phase);

    // 2. Register / Login test user
    const testEmail = `nlp_test_${Date.now()}@example.com`;
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "NLP Test User",
        email: testEmail,
        password: "password123"
      })
    });

    const regData = await regRes.json();
    const token = regData.access_token || regData.token;
    if (!regRes.ok || !token) {
      throw new Error(`Failed to register test user: ${JSON.stringify(regData)}`);
    }
    console.log("2. Auth Token Obtained for User:", regData.user.id);

    // 3. Upload a sample text resume
    const sampleResumeContent = `
SUMMARY
Experienced Full Stack Software Engineer and Machine Learning Researcher with expertise in building scalable web applications and AI models.

TECHNICAL SKILLS
Programming Languages: Python, JavaScript, TypeScript, Java, SQL, C++
Frameworks & Libraries: React, Node.js, Express.js, FastAPI, Django, PyTorch, Scikit-learn, Tailwind CSS
Databases: PostgreSQL, MongoDB, Redis
Cloud & DevOps: AWS, Docker, Kubernetes, Git, CI/CD

EDUCATION
Master of Science in Computer Science
Stanford University (2022 - 2024)
CGPA: 3.9/4.0

Bachelor of Technology in Information Technology
Indian Institute of Technology (2018 - 2022)
Score: 8.8/10.0

WORK EXPERIENCE
Senior Machine Learning Engineer
TechCorp Systems (Jan 2024 - Present)
- Designed and deployed NLP models using PyTorch and FastAPI on AWS EC2.
- Optimized PostgreSQL database queries, reducing response times by 40%.

Software Engineering Intern
Innovate Analytics (Jun 2023 - Dec 2023)
- Built interactive frontend dashboards using React, TypeScript, and Tailwind CSS.
- Developed backend microservices with Express.js and MongoDB.

PROJECTS
Career Intelligence AI Platform
- Built end-to-end resume parser and job matching engine using Python, FastAPI, React, and PostgreSQL.
- Technologies: Python, FastAPI, React, PostgreSQL, Docker

CERTIFICATIONS
AWS Certified Solutions Architect - Associate
Amazon Web Services (2023)

Meta Front-End Developer Professional Certificate
Coursera / Meta (2022)
`;

    const tmpFilePath = path.join(process.cwd(), `tmp_nlp_resume_${Date.now()}.txt`);
    fs.writeFileSync(tmpFilePath, sampleResumeContent, "utf-8");

    const fileBuffer = fs.readFileSync(tmpFilePath);
    const blob = new Blob([fileBuffer], { type: "text/plain" });

    const formData = new FormData();
    formData.append("file", blob, "nlp_candidate_resume.txt");

    const uploadRes = await fetch(`${API_BASE}/resumes/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const uploadData = await uploadRes.json();
    console.log("3. Resume Upload & Extraction Status:", uploadRes.status, uploadData.success);

    // Clean up local temp file
    if (fs.existsSync(tmpFilePath)) fs.unlinkSync(tmpFilePath);

    if (!uploadRes.ok || !uploadData.resume || !uploadData.resume.id) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    }

    const resumeId = uploadData.resume.id;

    // 4. Trigger NLP Analysis (POST /api/resumes/:id/analyze)
    console.log("\n4. Triggering NLP Resume Analysis via POST /api/resumes/" + resumeId + "/analyze ...");
    const analyzeRes = await fetch(`${API_BASE}/resumes/${resumeId}/analyze`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const analyzeData = await analyzeRes.json();
    console.log("   HTTP Status:", analyzeRes.status);
    console.log("   Analysis Success:", analyzeData.success);

    if (!analyzeRes.ok || !analyzeData.analysis) {
      throw new Error(`NLP Analysis failed: ${JSON.stringify(analyzeData)}`);
    }

    const analysis = analyzeData.analysis;
    console.log("   Analyzer Version:", analysis.analyzer_version);
    console.log("   Extracted Skills Count:", analysis.skills?.length);
    console.log("   Skills Sample:", analysis.skills?.slice(0, 5).map(s => `${s.skill_name} (${s.category})`));
    console.log("   Education Entries Count:", analysis.education?.length);
    console.log("   Experience Entries Count:", analysis.experience?.length);
    console.log("   Projects Count:", analysis.projects?.length);
    console.log("   Certifications Count:", analysis.certifications?.length);

    // Assertions
    if (!analysis.skills || analysis.skills.length === 0) {
      throw new Error("TEST FAILED: Expected extracted skills from sample resume, but got 0.");
    }

    const hasPython = analysis.skills.some((s) => s.skill_name === "Python");
    const hasReact = analysis.skills.some((s) => s.skill_name === "React");
    const hasPostgres = analysis.skills.some((s) => s.skill_name === "PostgreSQL");

    if (!hasPython || !hasReact || !hasPostgres) {
      throw new Error(`TEST FAILED: Essential skills missing from extraction. Extracted: ${JSON.stringify(analysis.skills)}`);
    }

    console.log("   ✅ Skills Extraction Assertion PASSED: Python, React, PostgreSQL correctly identified and categorized!");

    // 5. Fetch Candidate Analysis (GET /api/resumes/:id/analysis)
    console.log("\n5. Fetching Stored Analysis via GET /api/resumes/" + resumeId + "/analysis ...");
    const getRes = await fetch(`${API_BASE}/resumes/${resumeId}/analysis`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const getData = await getRes.json();
    console.log("   HTTP Status:", getRes.status);
    console.log("   Get Analysis Success:", getData.success);

    if (!getRes.ok || !getData.analysis) {
      throw new Error(`GET analysis failed: ${JSON.stringify(getData)}`);
    }

    console.log("   ✅ Persistence Assertion PASSED: Stored analysis successfully retrieved from database/store.");

    // 6. Test User Manual Correction (PUT /api/resumes/:id/analysis)
    console.log("\n6. Testing Candidate Profile Manual Edit via PUT /api/resumes/" + resumeId + "/analysis ...");
    const customSkill = {
      skill_name: "GraphQL",
      normalized_name: "graphql",
      category: "Frameworks & Libraries",
      confidence: 1.0,
      source: "user_added",
      is_user_corrected: true
    };

    const updatedSkills = [...analysis.skills, customSkill];

    const putRes = await fetch(`${API_BASE}/resumes/${resumeId}/analysis`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: "Updated Candidate Profile Summary by Candidate.",
        skills: updatedSkills
      })
    });

    const putData = await putRes.json();
    console.log("   HTTP Status:", putRes.status);
    console.log("   Update Success:", putData.success);

    if (!putRes.ok || !putData.analysis) {
      throw new Error(`PUT analysis failed: ${JSON.stringify(putData)}`);
    }

    const updatedAnalysis = putData.analysis;
    const addedSkill = updatedAnalysis.skills.find(s => s.normalized_name === "graphql");

    if (!addedSkill || !addedSkill.is_user_corrected) {
      throw new Error(`TEST FAILED: User correction flag or custom skill not updated properly.`);
    }

    console.log("   ✅ Manual Correction Assertion PASSED: Custom skill 'GraphQL' added and flagged as 'is_user_corrected: true'!");

    console.log("\n=======================================================");
    console.log("ALL PHASE 4 NLP INTELLIGENCE TESTS COMPLETED SUCCESSFULLY!");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("\n❌ PHASE 4 INTEGRATION TEST ERROR:", err);
    process.exit(1);
  }
}

runPhase4Tests();
