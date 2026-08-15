import express from "express";
import "dotenv/config";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import {
  initDatabase,
  findUserByEmail,
  findUserById,
  createUser,
  getUserProfile,
  updateUserProfile,
  createResumeRecord,
  getUserResumes,
  getResumeById,
  getResumeText,
  deleteUserResume,
  saveCandidateAnalysis,
  getCandidateAnalysis,
  updateCandidateAnalysis,
  getDatabaseStatus,
  saveJobAnalysis,
  createJobRecord,
  getJobsList,
  getJobById,
  deleteJobRecord,
  getJobAnalysis,
  importJobsBulk,
  seedBenchmarkJobsIfEmpty,
  saveMatchingResult,
  getCachedMatchingResult,
  getUserMatchingHistory
} from "./server/db.js";

import { parseResumeDocument } from "./server/resumeParser.js";
import { hybridMatchingEngine } from "./server/matching/hybridEngine.js";
import { analyzeResumeText } from "./server/nlp/pipeline.js";
import { processJobNlp } from "./server/nlp/jobPipeline.js";
import { matchingEngine } from "./server/embeddings/embeddingService.js";
import { EMBEDDING_CONFIG } from "./server/embeddings/config.js";
import { tfidfMatcher } from "./server/embeddings/tfidf.js";
import { recommendationService } from "./server/recommendation/recommendationService.js";
import { careerPredictionService } from "./server/career_prediction/predictor.js";
import { getCareerPredictionEvaluation } from "./server/career_prediction/evaluator.js";
import { roadmapService } from "./server/roadmap/roadmapService.js";
import { explanationService } from "./server/explainability/explanationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production";
const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

// Ensure upload directory exists
// Keep uploads outside dist so rebuilding the application does not remove them.
// This directory is ephemeral on most serverless hosts; use object storage for
// durable uploads in that deployment model.
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Disk Storage with UUID filenames for security
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase() || "bin";
    cb(null, `${uuidv4()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase() || "";
    const allowedExts = ["pdf", "docx", "txt"];
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain"
    ];

    if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type '.${ext}'. Only PDF and DOCX files are allowed.`));
    }
  },
});

// Middleware for JWT Authentication
function authenticateJwt(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Authentication token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const uid = decoded.sub || decoded.id || decoded.userId;
    req.user = {
      ...decoded,
      id: uid,
      sub: uid,
      userId: uid
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

async function startServer() {
  const app = express();
  const configuredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const PORT = Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Initialize DB on server start
  await initDatabase();
  await seedBenchmarkJobsIfEmpty();

  // =========================================
  // BACKEND REST API ENDPOINTS
  // =========================================

  // System Health
  app.get("/api/health", (_req, res) => {
    const dbInfo = getDatabaseStatus();
    res.json({
      status: "healthy",
      system: "AI Career Intelligence System",
      phase: "Phase 5 - Job Database, Job Description Ingestion & Job NLP Processing",
      timestamp: new Date().toISOString(),
      services: {
        nodeExpressApi: "online",
        pythonMlMicroservice: `configured (${process.env.PYTHON_ML_SERVICE_URL || "not configured"})`,
        geminiApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY"),
        database: {
          postgresConnected: dbInfo.isPostgresConnected,
          connectionUrlSanitized: dbInfo.databaseUrl,
          schemaStatus: "tables_active"
        }
      }
    });
  });

  // 1. REGISTER USER
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      if (!EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({ error: "Please enter a valid email address" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Check for duplicate email
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Duplicate registration: An account with this email already exists." });
      }

      // Hash password securely
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user + empty profile
      const user = await createUser(name, email, passwordHash);

      // Generate short-lived JWT token
      const token = jwt.sign(
        { sub: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(201).json({
        success: true,
        message: "Registration successful",
        access_token: token,
        token_type: "bearer",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        }
      });
    } catch (err: any) {
      console.error("[Auth API Error - Register]:", err);
      return res.status(500).json({ error: "Internal server error during user registration" });
    }
  });

  // 2. LOGIN USER
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { sub: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({
        success: true,
        message: "Login successful",
        access_token: token,
        token_type: "bearer",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        }
      });
    } catch (err: any) {
      console.error("[Auth API Error - Login]:", err);
      return res.status(500).json({ error: "Internal server error during login" });
    }
  });

  // 3. CURRENT USER (/api/auth/me)
  app.get("/api/auth/me", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const user = await findUserById(userId);

      if (!user) {
        return res.status(404).json({ error: "User account not found" });
      }

      const profile = await getUserProfile(userId);
      const resumes = await getUserResumes(userId);

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "Graduate Student / Candidate",
          created_at: user.created_at
        },
        profile: profile || {
          phone: "",
          location: "",
          education: "",
          experience_years: 0,
          target_role: ""
        },
        resumes_count: resumes.length
      });
    } catch (err: any) {
      console.error("[Auth API Error - Me]:", err);
      return res.status(500).json({ error: "Failed to retrieve user profile" });
    }
  });

  // 4. LOGOUT USER
  app.post("/api/auth/logout", (_req, res) => {
    return res.json({ success: true, message: "Logged out successfully" });
  });

  // 5. GET USER PROFILE
  app.get("/api/users/profile", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const profile = await getUserProfile(userId);
      return res.json({ profile: profile || {} });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // 6. UPDATE USER PROFILE
  app.put("/api/users/profile", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const { phone, location, education, experience_years, target_role } = req.body;

      const updated = await updateUserProfile(userId, {
        phone,
        location,
        education,
        experience_years: experience_years !== undefined ? Number(experience_years) : undefined,
        target_role
      });

      return res.json({
        success: true,
        message: "Profile updated successfully",
        profile: updated
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // =========================================
  // PHASE 3: RESUME UPLOAD & TEXT EXTRACTION API
  // =========================================

  // Helper for uploading single resume file
  const handleResumeUpload = async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please select a valid PDF or DOCX file." });
    }

    const userId = req.user.sub;
    const filePath = req.file.path;
    const storedFilename = req.file.filename;
    const originalFilename = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;

    let extractedText = "";
    let processingStatus = "completed";
    let processingError = "";
    let textStats = { charCount: 0, wordCount: 0, lineCount: 0 };

    try {
      const parseResult = await parseResumeDocument(filePath, mimeType, originalFilename);
      extractedText = parseResult.extractedText;
      textStats = {
        charCount: parseResult.charCount,
        wordCount: parseResult.wordCount,
        lineCount: parseResult.lineCount,
      };

      if (parseResult.warning) {
        processingError = parseResult.warning;
      }
    } catch (err: any) {
      console.error("[Resume Parser Error]:", err.message);
      processingStatus = "failed";
      processingError = err.message || "Failed to extract text from file";
    }

    const savedRecord = await createResumeRecord(
      userId,
      originalFilename,
      storedFilename,
      filePath,
      mimeType,
      fileSize,
      extractedText,
      processingStatus,
      processingError
    );

    return res.status(201).json({
      success: true,
      message: processingStatus === "completed"
        ? "Resume uploaded and text extracted successfully."
        : "Resume file stored, but text extraction encountered an issue.",
      resume: savedRecord,
      extraction: {
        status: processingStatus,
        charCount: textStats.charCount,
        wordCount: textStats.wordCount,
        lineCount: textStats.lineCount,
        previewSnippet: extractedText ? extractedText.substring(0, 300) + (extractedText.length > 300 ? "..." : "") : "",
        error: processingError || null
      }
    });
  };

  // 7. UPLOAD RESUME (Multer error handling middleware wrapper)
  app.post(
    "/api/resumes/upload",
    authenticateJwt,
    (req: any, res: any, next: any) => {
      upload.single("file")(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size exceeds maximum limit of 10MB." });
          }
          return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    },
    handleResumeUpload
  );

  // Alias endpoint: /api/resumes (allows upload via POST /api/resumes)
  app.post(
    "/api/resumes",
    authenticateJwt,
    (req: any, res: any, next: any) => {
      upload.single("file")(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File size exceeds maximum limit of 10MB." });
          }
          return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    },
    handleResumeUpload
  );

  // 8. LIST USER RESUMES (IDOR Protected)
  app.get("/api/resumes", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const resumes = await getUserResumes(userId);
      return res.json({ resumes });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to list user resumes" });
    }
  });

  // 9. GET RESUME BY ID (IDOR Protected)
  app.get("/api/resumes/:id", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const resumeId = req.params.id;

      const resume = await getResumeById(userId, resumeId);
      if (!resume) {
        return res.status(404).json({ error: "Resume not found or access denied" });
      }

      return res.json({ resume });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to retrieve resume details" });
    }
  });

  // 10. GET EXTRACTED RESUME TEXT BY ID (IDOR Protected)
  app.get("/api/resumes/:id/text", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const resumeId = req.params.id;

      const resumeData = await getResumeText(userId, resumeId);
      if (!resumeData) {
        return res.status(404).json({ error: "Resume not found or access denied" });
      }

      return res.json({
        resume_id: resumeData.id,
        original_filename: resumeData.original_filename,
        extracted_text: resumeData.extracted_text,
        processing_status: resumeData.processing_status,
        processing_error: resumeData.processing_error,
        char_count: resumeData.extracted_text ? resumeData.extracted_text.length : 0,
        word_count: resumeData.extracted_text ? resumeData.extracted_text.split(/\s+/).filter(Boolean).length : 0
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch extracted text" });
    }
  });

  // 11. ANALYZE RESUME TEXT (POST /api/resumes/:id/analyze)
  app.post("/api/resumes/:id/analyze", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const resumeId = req.params.id;

      // Check IDOR & Fetch extracted text
      const resumeData = await getResumeText(userId, resumeId);
      if (!resumeData) {
        return res.status(404).json({ error: "Resume not found or access denied" });
      }

      if (!resumeData.extracted_text || !resumeData.extracted_text.trim()) {
        return res.status(400).json({
          error: "Resume has no extracted text. Please re-upload or ensure file is readable."
        });
      }

      // Execute NLP Extraction Pipeline
      const nlpResult = analyzeResumeText(resumeData.extracted_text);

      // Save analysis into database/store
      const savedProfile = await saveCandidateAnalysis(userId, resumeId, nlpResult);

      return res.json({
        success: true,
        message: "Resume NLP analysis completed successfully.",
        resume_id: resumeId,
        analysis: savedProfile || nlpResult
      });
    } catch (err: any) {
      console.error("[NLP Analyze Error]:", err);
      return res.status(500).json({ error: `NLP Resume Analysis failed: ${err.message}` });
    }
  });

  // 12. GET CANDIDATE PROFILE ANALYSIS (GET /api/resumes/:id/analysis)
  app.get("/api/resumes/:id/analysis", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const resumeId = req.params.id;

      // Verify resume ownership
      const resume = await getResumeById(userId, resumeId);
      if (!resume) {
        return res.status(404).json({ error: "Resume not found or access denied" });
      }

      const analysis = await getCandidateAnalysis(userId, resumeId);
      if (!analysis) {
        return res.status(404).json({
          error: "No analysis found for this resume. Click 'Analyze Resume' to trigger NLP processing.",
          resume_id: resumeId,
          analysis_status: "not_started"
        });
      }

      return res.json({
        success: true,
        resume_id: resumeId,
        analysis
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to retrieve candidate analysis" });
    }
  });

  // 13. UPDATE / CORRECT CANDIDATE PROFILE ANALYSIS (PUT /api/resumes/:id/analysis)
  app.put("/api/resumes/:id/analysis", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const resumeId = req.params.id;
      const updatePayload = req.body;

      const resume = await getResumeById(userId, resumeId);
      if (!resume) {
        return res.status(404).json({ error: "Resume not found or access denied" });
      }

      const updated = await updateCandidateAnalysis(userId, resumeId, updatePayload);
      if (!updated) {
        return res.status(404).json({ error: "Analysis record not found for update" });
      }

      return res.json({
        success: true,
        message: "Candidate profile analysis updated successfully.",
        analysis: updated
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to update candidate profile analysis" });
    }
  });

  // 11. DELETE USER RESUME (IDOR Protected + Unlinks physical file)
  app.delete("/api/resumes/:id", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const resumeId = req.params.id;

      const result = await deleteUserResume(userId, resumeId);
      if (!result.success) {
        return res.status(403).json({ error: "Forbidden: Resume not found or permission denied" });
      }

      // Safely unlink file if it exists on disk
      if (result.fileToDelete && fs.existsSync(result.fileToDelete)) {
        try {
          fs.unlinkSync(result.fileToDelete);
        } catch (e) {
          console.warn("[Storage Notice]: Could not delete physical file:", result.fileToDelete);
        }
      }

      return res.json({ success: true, message: "Resume deleted successfully" });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete resume" });
    }
  });

  // ================================================================
  // PHASE 5: JOB INTELLIGENCE & INGESTION ENDPOINTS
  // ================================================================

  // 14. CREATE JOB POSTING (POST /api/jobs)
  app.post("/api/jobs", authenticateJwt, async (req: any, res) => {
    try {
      const { title, company, description, location, work_mode, employment_type, salary_min, salary_max, salary_currency, application_url, source, external_job_id } = req.body;

      if (!title || !title.trim() || !company || !company.trim() || !description || !description.trim()) {
        return res.status(400).json({
          error: "Validation error: Missing required fields (title, company, and description are required)."
        });
      }

      const result = await createJobRecord({
        title: title.trim(),
        company: company.trim(),
        description: description.trim(),
        location: location ? location.trim() : "Not specified",
        work_mode,
        employment_type,
        salary_min: salary_min ? parseFloat(salary_min) : undefined,
        salary_max: salary_max ? parseFloat(salary_max) : undefined,
        salary_currency,
        application_url,
        source,
        external_job_id
      });

      if (result.isDuplicate) {
        return res.status(409).json({
          error: "Duplicate job posting detected.",
          existing_job_id: result.existingId
        });
      }

      return res.status(201).json({
        success: true,
        message: "Job posting created and analyzed successfully.",
        job: result.job
      });
    } catch (err: any) {
      console.error("[Create Job Error]:", err);
      return res.status(500).json({ error: "Failed to create job posting." });
    }
  });

  // 15. LIST JOBS WITH SEARCH, FILTERING, PAGINATION (GET /api/jobs)
  app.get("/api/jobs", async (req, res) => {
    try {
      const search = req.query.search as string;
      const work_mode = req.query.work_mode as string;
      const employment_type = req.query.employment_type as string;
      const location = req.query.location as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const page_size = req.query.page_size ? parseInt(req.query.page_size as string, 10) : 10;

      const result = await getJobsList({
        search,
        work_mode,
        employment_type,
        location,
        page,
        page_size
      });

      return res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      console.error("[Get Jobs List Error]:", err);
      return res.status(500).json({ error: "Failed to fetch job postings." });
    }
  });

  // 16. GET JOB DETAILS (GET /api/jobs/:id)
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = req.params.id;
      const job = await getJobById(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job posting not found." });
      }

      return res.json({
        success: true,
        job
      });
    } catch (err: any) {
      console.error("[Get Job Details Error]:", err);
      return res.status(500).json({ error: "Failed to fetch job details." });
    }
  });

  // 17. TRIGGER JOB NLP ANALYSIS (POST /api/jobs/:id/analyze)
  app.post("/api/jobs/:id/analyze", authenticateJwt, async (req: any, res) => {
    try {
      const jobId = req.params.id;
      const job = await getJobById(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job posting not found." });
      }

      const nlpResult = processJobNlp(
        job.title,
        job.company,
        job.description,
        job.work_mode,
        job.employment_type
      );

      const savedAnalysis = await saveJobAnalysis(jobId, nlpResult);

      return res.json({
        success: true,
        message: "Job description NLP analysis completed.",
        job_id: jobId,
        analysis: savedAnalysis
      });
    } catch (err: any) {
      console.error("[Analyze Job Error]:", err);
      return res.status(500).json({ error: "Failed to analyze job description." });
    }
  });

  // 18. GET JOB ANALYSIS (GET /api/jobs/:id/analysis)
  app.get("/api/jobs/:id/analysis", async (req, res) => {
    try {
      const jobId = req.params.id;
      const analysis = await getJobAnalysis(jobId);

      if (!analysis) {
        return res.status(404).json({
          error: "Job analysis not found. Click 'Run NLP Analysis' to process.",
          job_id: jobId,
          analysis_status: "not_started"
        });
      }

      return res.json({
        success: true,
        analysis
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch job analysis." });
    }
  });

  // 19. IMPORT JOBS BULK (POST /api/jobs/import)
  app.post("/api/jobs/import", authenticateJwt, async (req: any, res) => {
    try {
      const { jobs } = req.body;

      if (!Array.isArray(jobs) || jobs.length === 0) {
        return res.status(400).json({
          error: "Validation error: 'jobs' must be a non-empty array of job objects."
        });
      }

      const result = await importJobsBulk(jobs);

      return res.json({
        success: true,
        message: `Import complete: ${result.imported} imported, ${result.skipped} skipped/duplicates.`,
        ...result
      });
    } catch (err: any) {
      console.error("[Import Jobs Error]:", err);
      return res.status(500).json({ error: "Failed to import jobs." });
    }
  });

  // 20. DELETE JOB (DELETE /api/jobs/:id)
  app.delete("/api/jobs/:id", authenticateJwt, async (req: any, res) => {
    try {
      const jobId = req.params.id;
      const deleted = await deleteJobRecord(jobId);

      if (!deleted) {
        return res.status(404).json({ error: "Job posting not found." });
      }

      return res.json({ success: true, message: "Job posting deleted successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete job posting." });
    }
  });

  // ================================================================
  // PHASE 6: SEMANTIC MATCHING API ENDPOINTS (Sentence-BERT + TF-IDF)
  // ================================================================

  // 21. RUN HYBRID MATCHING & SKILL GAP ANALYSIS (POST /api/matching/resume/:resume_id/job/:job_id)
  app.post("/api/matching/resume/:resume_id/job/:job_id", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { resume_id, job_id } = req.params;

      // 1. Verify Resume existence & ownership
      const resume = await getResumeById(userId, resume_id);
      if (!resume || resume.user_id !== userId) {
        return res.status(404).json({ error: "Resume not found or access unauthorized." });
      }

      // 2. Verify Candidate NLP Analysis exists
      const candidateAnalysis = await getCandidateAnalysis(userId, resume_id);
      if (!candidateAnalysis) {
        return res.status(400).json({
          error: "Candidate profile analysis is missing. Please run NLP processing on this resume first.",
          resume_id
        });
      }

      // 3. Verify Job existence
      const jobRecord = await getJobById(job_id);
      if (!jobRecord) {
        return res.status(404).json({ error: "Job posting not found." });
      }

      // 4. Get or auto-trigger Job NLP Analysis
      let jobAnalysis = await getJobAnalysis(job_id);
      if (!jobAnalysis) {
        const nlpResult = processJobNlp(
          jobRecord.title,
          jobRecord.company,
          jobRecord.description,
          jobRecord.work_mode,
          jobRecord.employment_type
        );
        jobAnalysis = await saveJobAnalysis(job_id, nlpResult);
      }

      // 5. Compute Full Hybrid Multi-Factor Matching & Skill Gap Analysis
      const rawResumeText = await getResumeText(userId, resume_id);
      const hybridResult = await hybridMatchingEngine.computeHybridMatch(
        resume_id,
        candidateAnalysis,
        rawResumeText || "",
        jobRecord
      );

      // Build content hashes for caching lookup
      const candRep = (await import("./server/embeddings/representation.js")).buildCandidateRepresentations(candidateAnalysis);
      const jobRep = (await import("./server/embeddings/representation.js")).buildJobRepresentations(jobRecord, jobAnalysis);

      // 6. Save to Database
      const savedResult = await saveMatchingResult({
        user_id: userId,
        resume_id,
        job_id,
        model_name: hybridResult.model_name,
        candidate_hash: candRep.contentHash,
        job_hash: jobRep.contentHash,
        semantic_similarity: hybridResult.semantic_similarity,
        semantic_score: hybridResult.semantic_score,
        tfidf_similarity: hybridResult.tfidf_similarity,
        tfidf_score: hybridResult.tfidf_score,
        overall_score: hybridResult.overall_score,
        skill_score: hybridResult.skill_score,
        experience_score: hybridResult.experience_score,
        education_score: hybridResult.education_score,
        ats_score: hybridResult.ats_score,
        matched_required_skills: hybridResult.matched_required_skills,
        missing_required_skills: hybridResult.missing_required_skills,
        matched_preferred_skills: hybridResult.matched_preferred_skills,
        missing_preferred_skills: hybridResult.missing_preferred_skills,
        related_skills: hybridResult.related_skills,
        strengths: hybridResult.strengths,
        weaknesses: hybridResult.weaknesses,
        algorithm_version: hybridResult.algorithm_version,
        weight_configuration: hybridResult.weight_configuration,
        component_scores: hybridResult.breakdown,
        explanation: hybridResult.explanation
      });

      return res.json({
        success: true,
        is_cached: false,
        match: {
          id: savedResult.id,
          resume_id,
          job_id,
          overall_score: hybridResult.overall_score,
          semantic_score: hybridResult.semantic_score,
          skill_score: hybridResult.skill_score,
          experience_score: hybridResult.experience_score,
          education_score: hybridResult.education_score,
          ats_score: hybridResult.ats_score,
          semantic_similarity: hybridResult.semantic_similarity,
          tfidf_score: hybridResult.tfidf_score,
          model_name: hybridResult.model_name,
          matched_required_skills: hybridResult.matched_required_skills,
          missing_required_skills: hybridResult.missing_required_skills,
          matched_preferred_skills: hybridResult.matched_preferred_skills,
          missing_preferred_skills: hybridResult.missing_preferred_skills,
          related_skills: hybridResult.related_skills,
          strengths: hybridResult.strengths,
          weaknesses: hybridResult.weaknesses,
          explanation: hybridResult.explanation,
          algorithm_version: hybridResult.algorithm_version,
          weight_configuration: hybridResult.weight_configuration,
          breakdown: hybridResult.breakdown,
          created_at: savedResult.created_at || hybridResult.calculated_at
        }
      });
    } catch (err: any) {
      console.error("[Hybrid Matching Error]:", err);
      return res.status(500).json({ error: "Failed to calculate hybrid match: " + err.message });
    }
  });

  // 22. GET USER MATCHING HISTORY (GET /api/matching/history)
  app.get("/api/matching/history", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const history = await getUserMatchingHistory(userId);

      return res.json({
        success: true,
        total: history.length,
        history
      });
    } catch (err: any) {
      console.error("[Get Matching History Error]:", err);
      return res.status(500).json({ error: "Failed to fetch matching history." });
    }
  });

  // 23. MODEL COMPARISON ENDPOINT (POST /api/matching/compare)
  app.post("/api/matching/compare", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { resume_id, job_id } = req.body;

      if (!resume_id || !job_id) {
        return res.status(400).json({ error: "resume_id and job_id are required." });
      }

      const resume = await getResumeById(userId, resume_id);
      if (!resume || resume.user_id !== userId) {
        return res.status(404).json({ error: "Resume not found or unauthorized." });
      }

      const candidateAnalysis = await getCandidateAnalysis(userId, resume_id);
      const jobRecord = await getJobById(job_id);

      if (!candidateAnalysis || !jobRecord) {
        return res.status(400).json({ error: "Candidate analysis or job record missing." });
      }

      const candRep = (await import("./server/embeddings/representation.js")).buildCandidateRepresentations(candidateAnalysis);
      const jobRep = (await import("./server/embeddings/representation.js")).buildJobRepresentations(jobRecord);

      // Sentence-BERT Match
      const sbertResult = await matchingEngine.computeMatch(resume_id, candidateAnalysis, jobRecord);
      
      // TF-IDF Match
      const tfidfResult = tfidfMatcher.computeSimilarity(candRep.overallText, jobRep.overallText);

      // Hybrid Multi-Factor Match
      const rawResumeText = await getResumeText(userId, resume_id);
      const hybridResult = await hybridMatchingEngine.computeHybridMatch(resume_id, candidateAnalysis, rawResumeText || "", jobRecord);

      return res.json({
        success: true,
        models: {
          hybrid: {
            name: "Hybrid Candidate-Job Engine v1.0",
            score: hybridResult.overall_score,
            sub_scores: {
              semantic: hybridResult.semantic_score,
              skill: hybridResult.skill_score,
              experience: hybridResult.experience_score,
              education: hybridResult.education_score,
              ats: hybridResult.ats_score
            },
            explanation: hybridResult.explanation
          },
          sbert: {
            name: EMBEDDING_CONFIG.MODEL_NAME,
            similarity: sbertResult.semantic_similarity,
            score: sbertResult.semantic_score,
            components: sbertResult.component_scores
          },
          tfidf: {
            name: "TF-IDF Unigram+Bigram Cosine Baseline",
            similarity: tfidfResult.similarity,
            score: tfidfResult.score
          }
        },
        comparison_notes: "Hybrid matching combines Sentence-BERT contextual semantic embeddings with deterministic skill, experience, education, and ATS format coverage algorithms."
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Comparison failed: " + err.message });
    }
  });

  // 24. GET INTELLIGENT JOB RECOMMENDATIONS (GET /api/recommendations)
  app.get("/api/recommendations", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      let resumeId = req.query.resume_id as string;

      if (!resumeId) {
        const userResumes = await getUserResumes(userId);
        const completed = userResumes.find((r: any) => r.processing_status === "completed") || userResumes[0];
        if (completed) {
          resumeId = completed.id;
        }
      }

      if (!resumeId) {
        return res.json({
          cold_start: true,
          reason: "NO_RESUME",
          message: "Upload and analyze a resume to receive personalized job recommendations."
        });
      }

      const resume = await getResumeById(userId, resumeId);
      if (!resume || resume.user_id !== userId) {
        return res.status(403).json({ error: "Access denied: Resume does not belong to authenticated user." });
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.page_size ? parseInt(req.query.page_size as string, 10) : 10;
      const location = req.query.location as string;
      const workMode = req.query.work_mode as string;
      const employmentType = req.query.employment_type as string;
      const minimumScore = req.query.minimum_score ? parseFloat(req.query.minimum_score as string) : undefined;
      const targetRole = req.query.target_role as string;
      const sortBy = (req.query.sort_by as any) || "best_match";
      const forceRefresh = req.query.force_refresh === "true" || req.query.refresh === "true";

      const recResult = await recommendationService.getRecommendations({
        userId,
        resumeId,
        page,
        pageSize,
        filters: {
          location,
          work_mode: workMode,
          employment_type: employmentType,
          minimum_score: minimumScore,
          target_role: targetRole
        },
        sortBy,
        forceRefresh
      });

      return res.json(recResult);
    } catch (err: any) {
      console.error("[Get Recommendations Error]:", err);
      return res.status(500).json({ error: "Failed to fetch recommendations: " + err.message });
    }
  });

  // 25. REFRESH JOB RECOMMENDATIONS (POST /api/recommendations/refresh)
  app.post("/api/recommendations/refresh", authenticateJwt, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const {
        resume_id,
        location,
        work_mode,
        employment_type,
        minimum_score,
        target_role,
        sort_by,
        page,
        page_size
      } = req.body || {};

      let targetResumeId = resume_id;
      if (!targetResumeId) {
        const userResumes = await getUserResumes(userId);
        const completed = userResumes.find((r: any) => r.processing_status === "completed") || userResumes[0];
        if (completed) targetResumeId = completed.id;
      }

      if (!targetResumeId) {
        return res.status(400).json({
          cold_start: true,
          reason: "NO_RESUME",
          message: "Upload and analyze a resume to receive personalized recommendations."
        });
      }

      const resume = await getResumeById(userId, targetResumeId);
      if (!resume || resume.user_id !== userId) {
        return res.status(403).json({ error: "Access denied: Resume does not belong to authenticated user." });
      }

      const recResult = await recommendationService.getRecommendations({
        userId,
        resumeId: targetResumeId,
        page: page ? parseInt(page, 10) : 1,
        pageSize: page_size ? parseInt(page_size, 10) : 10,
        filters: {
          location,
          work_mode,
          employment_type,
          minimum_score: minimum_score ? parseFloat(minimum_score) : undefined,
          target_role
        },
        sortBy: sort_by || "best_match",
        forceRefresh: true
      });

      return res.json(recResult);
    } catch (err: any) {
      console.error("[Refresh Recommendations Error]:", err);
      return res.status(500).json({ error: "Failed to refresh recommendations: " + err.message });
    }
  });


  // System Architecture Information
  app.get("/api/system/info", (_req, res) => {
    res.json({
      projectTitle: "AI Career Intelligence System",
      subtitle: "Explainable AI-Based Career Recommendation and Job Matching Using NLP, Deep Learning, and RAG",
      matchingWeights: {
        semanticSimilarity: 0.35,
        skillMatch: 0.30,
        experienceMatch: 0.15,
        educationMatch: 0.10,
        atsCompatibility: 0.10
      },
      evaluationMetrics: ["Accuracy", "Precision", "Recall", "F1-score", "NDCG@K", "MRR", "Inference Time"],
      architectureModules: [
        { name: "Phase 1: Architecture & Foundation", status: "Completed", implemented: true },
        { name: "Phase 2: Authentication & Database Schema", status: "Completed", implemented: true },
        { name: "Phase 3: Resume Upload, Document Parsing & Text Storage", status: "Active / Completed", implemented: true },
        { name: "Phase 4: Semantic Matching & ML Engine", status: "Pending Phase 4", implemented: false },
        { name: "Phase 5: Explainable AI (XAI) & SHAP", status: "Pending Phase 5", implemented: false },
        { name: "Phase 6: RAG Career Assistant & Evaluation", status: "Pending Phase 6", implemented: false }
      ]
    });
  });

  // Benchmark Jobs Collection
  app.get("/api/jobs", (_req, res) => {
    res.json({
      total: 5,
      data: [
        {
          id: "job_01",
          title: "Senior AI / Machine Learning Engineer",
          company: "NeuralTech Labs",
          location: "Remote / San Francisco, CA",
          type: "Full-Time",
          experience_level: "Senior (3-5+ years)",
          required_skills: ["Python", "PyTorch", "Transformers", "NLP", "FastAPI", "Docker", "Vector Databases", "LangChain/RAG"],
          education: "B.S. / M.S. in Computer Science or related STEM field",
          description: "We are seeking a Senior AI/ML Engineer to lead the development of enterprise LLM applications, RAG pipelines, and fine-tuned Sentence-BERT models for semantic search and document reasoning."
        },
        {
          id: "job_02",
          title: "Full-Stack Software Engineer (React + Node/Python)",
          company: "Nexus Innovations",
          location: "Hybrid / New York, NY",
          type: "Full-Time",
          experience_level: "Mid-Senior (2-4 years)",
          required_skills: ["React", "TypeScript", "Node.js", "Express", "Python", "PostgreSQL", "Tailwind CSS", "REST APIs"],
          education: "B.S. in Computer Science or Equivalent Experience",
          description: "Join our core product team building high-performance web platforms. You will design modular React micro-frontends and robust asynchronous Python/Node backend services."
        },
        {
          id: "job_03",
          title: "NLP Research Data Scientist",
          company: "Cognitive Research Institute",
          location: "Remote",
          type: "Full-Time",
          experience_level: "Mid-Level (2+ years)",
          required_skills: ["Python", "Scikit-Learn", "Hugging Face", "BERT", "NLTK/SpaCy", "SHAP", "FAISS", "Feature Engineering"],
          education: "M.S. or Ph.D. in Computer Science, Computational Linguistics, or Data Science",
          description: "Conduct cutting-edge research in explainable NLP, resume extraction, entity recognition, and information retrieval evaluation metrics (NDCG@K, MRR)."
        },
        {
          id: "job_04",
          title: "Backend Platform Engineer",
          company: "DataScale Systems",
          location: "Boston, MA",
          type: "Full-Time",
          experience_level: "Mid-Level (2-3 years)",
          required_skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "CI/CD", "System Architecture", "Microservices"],
          education: "B.S. in Computer Science or Software Engineering",
          description: "Architect scalable backend microservices, database schemas, and caching layers to process high-throughput career telemetry and real-time candidate search queries."
        },
        {
          id: "job_05",
          title: "Junior Data Analyst & Machine Learning Associate",
          company: "Acuity Insights",
          location: "Chicago, IL",
          type: "Full-Time",
          experience_level: "Entry-Level (0-2 years)",
          required_skills: ["Python", "Pandas", "NumPy", "SQL", "Scikit-Learn", "Data Visualization", "Git"],
          education: "B.S. in Computer Science, Data Science, or Statistics",
          description: "Ideal entry-level opportunity for CSE graduates to clean datasets, build baseline TF-IDF models, execute statistical evaluations, and generate analytical dashboards."
        }
      ]
    });
  });

  // ================================================================
  // PHASE 9: ML CAREER ROLE PREDICTION & CLASSIFICATION ENDPOINTS
  // ================================================================
  app.post("/api/career/predict", authenticateJwt, async (req: any, res: any) => {
    try {
      const { resume_id, top_k } = req.body;
      if (!resume_id) {
        return res.status(400).json({ error: "resume_id is required for career role prediction" });
      }

      const topKNum = parseInt(top_k) || 5;
      const predictions = await careerPredictionService.predictForResume(req.user.id, resume_id, topKNum);
      res.json(predictions);
    } catch (err: any) {
      console.error("[Career Role Prediction API Error]:", err);
      res.status(400).json({ error: err.message || "Failed to generate career role predictions" });
    }
  });

  app.get("/api/career/predictions", authenticateJwt, async (req: any, res: any) => {
    try {
      const { resume_id } = req.query;
      if (!resume_id) {
        return res.status(400).json({ error: "resume_id query parameter is required" });
      }

      const history = await careerPredictionService.getHistoryForResume(req.user.id, resume_id as string);
      res.json({ resume_id, total: history.length, data: history });
    } catch (err: any) {
      console.error("[Career Predictions History Error]:", err);
      res.status(400).json({ error: err.message || "Failed to retrieve historical predictions" });
    }
  });

  app.get("/api/career/evaluation", (_req, res) => {
    try {
      const evalReport = getCareerPredictionEvaluation();
      res.json(evalReport);
    } catch (err: any) {
      console.error("[Career Model Evaluation Error]:", err);
      res.status(500).json({ error: "Failed to load career prediction evaluation benchmarks" });
    }
  });

  // =========================================
  // PHASE 10: CAREER ROADMAP API ENDPOINTS
  // =========================================

  // 1. Generate Personalized Career Roadmap (POST /api/career/roadmap)
  app.post("/api/career/roadmap", authenticateJwt, async (req: any, res: any) => {
    try {
      const { resume_id, target_role, duration_months } = req.body;
      if (!resume_id) {
        return res.status(400).json({ error: "resume_id is required" });
      }
      if (!target_role || !target_role.trim()) {
        return res.status(400).json({ error: "target_role is required" });
      }

      const duration = duration_months ? parseInt(duration_months, 10) : 6;
      const result = await roadmapService.generateRoadmap(req.user.id, resume_id, target_role, duration);

      res.json({
        success: true,
        data: result.roadmap,
        evaluation: result.evaluation
      });
    } catch (err: any) {
      console.error("[Generate Career Roadmap Error]:", err);
      res.status(400).json({ error: err.message || "Failed to generate career roadmap" });
    }
  });

  // 2. Get Roadmap Details By ID (GET /api/career/roadmap/:id)
  app.get("/api/career/roadmap/:id", authenticateJwt, async (req: any, res: any) => {
    try {
      const roadmapId = req.params.id;
      const roadmap = await roadmapService.getRoadmapById(req.user.id, roadmapId);
      res.json({ success: true, data: roadmap });
    } catch (err: any) {
      console.error("[Get Roadmap Error]:", err);
      res.status(404).json({ error: err.message || "Roadmap not found" });
    }
  });

  // 3. Get User Roadmaps History / Active List (GET /api/career/roadmaps)
  app.get("/api/career/roadmaps", authenticateJwt, async (req: any, res: any) => {
    try {
      const resumeId = req.query.resume_id as string;
      const roadmaps = await roadmapService.getUserRoadmaps(req.user.id, resumeId);
      res.json({ success: true, count: roadmaps.length, data: roadmaps });
    } catch (err: any) {
      console.error("[Get User Roadmaps Error]:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve user roadmaps" });
    }
  });

  // 4. Update Milestone Progress (PATCH /api/career/roadmap/milestones/:milestone_id)
  app.patch("/api/career/roadmap/milestones/:milestone_id", authenticateJwt, async (req: any, res: any) => {
    try {
      const milestoneId = req.params.milestone_id;
      const { status, progress_percentage, notes } = req.body;

      if (!status || !["not_started", "in_progress", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value. Must be 'not_started', 'in_progress', or 'completed'." });
      }

      if (typeof progress_percentage !== "number" || progress_percentage < 0 || progress_percentage > 100) {
        return res.status(400).json({ error: "Invalid progress_percentage. Must be a number between 0 and 100." });
      }

      const updated = await roadmapService.updateMilestone(
        req.user.id,
        milestoneId,
        status,
        progress_percentage,
        notes || ""
      );

      res.json({
        success: true,
        message: "Milestone progress updated successfully",
        data: updated
      });
    } catch (err: any) {
      console.error("[Update Milestone Error]:", err);
      res.status(400).json({ error: err.message || "Failed to update milestone progress" });
    }
  });

  // ================================================================
  // PHASE 11: EXPLAINABLE AI WITH SHAP ENDPOINTS
  // ================================================================

  // 1. Get Career Prediction SHAP Explanation (GET /api/career/prediction/:prediction_id/explanation)
  app.get("/api/career/prediction/:prediction_id/explanation", authenticateJwt, async (req: any, res: any) => {
    try {
      const userId = req.user.id || req.user.userId || req.user.sub;
      const predictionId = req.params.prediction_id;
      const targetRole = req.query.role as string;
      const resumeId = req.query.resume_id as string;

      const explanation = await explanationService.getCareerPredictionExplanation(
        userId,
        predictionId,
        targetRole,
        resumeId
      );

      res.json({ success: true, data: explanation });
    } catch (err: any) {
      console.error("[Career Prediction Explanation API Error]:", err);
      res.status(500).json({ error: err.message || "Failed to calculate career prediction SHAP explanation" });
    }
  });

  // 2. Get Job Matching Explanation (GET /api/matching/:matching_result_id/explanation)
  app.get("/api/matching/:matching_result_id/explanation", authenticateJwt, async (req: any, res: any) => {
    try {
      const userId = req.user.id || req.user.userId || req.user.sub;
      const matchingResultId = req.params.matching_result_id;
      const resumeId = req.query.resume_id as string;
      const jobId = req.query.job_id as string;

      const explanation = await explanationService.getMatchingExplanation(
        userId,
        matchingResultId,
        resumeId,
        jobId
      );

      res.json({ success: true, data: explanation });
    } catch (err: any) {
      console.error("[Matching Explanation API Error]:", err);
      res.status(500).json({ error: err.message || "Failed to calculate job matching explanation" });
    }
  });

  // 3. Get Global Feature Importance (GET /api/career/explainability/global)
  app.get("/api/career/explainability/global", authenticateJwt, async (_req: any, res: any) => {
    try {
      const globalImportance = explanationService.getGlobalFeatureImportance();
      res.json({ success: true, data: globalImportance });
    } catch (err: any) {
      console.error("[Global Feature Importance Error]:", err);
      res.status(500).json({ error: err.message || "Failed to calculate global feature importance" });
    }
  });

  // Serve Vite in Development, Static in Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // server.js and Vite's index.html are both emitted to dist/.  The previous
    // path used dist/dist, which caused every production page to return 404.
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AI Career Intelligence System] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
