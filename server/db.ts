import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { processJobNlp } from "./nlp/jobPipeline.js";

// Initialize PostgreSQL Connection Pool
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ai_career_db";

export const pool = new Pool({
  connectionString: databaseUrl,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isPostgresConnected = false;

// Fallback In-Memory Store if Postgres DB is offline
const inMemoryStore = {
  users: new Map<string, any>(), // email -> user
  usersById: new Map<string, any>(), // id -> user
  profiles: new Map<string, any>(), // userId -> profile
  resumes: new Map<string, any[]>(), // userId -> resumes[]
  candidateAnalyses: new Map<string, any>(), // resumeId -> candidate analysis object
  jobs: new Map<string, any>(), // jobId -> job object
  jobAnalyses: new Map<string, any>(), // jobId -> job analysis object
  matchingResults: new Map<string, any>(), // key (userId_resumeId_jobId_model) -> matching result
  recommendations: new Map<string, any[]>(), // key (userId_resumeId_algVersion) -> recommendation records
  careerPredictions: new Map<string, any[]>(), // key (resumeId) -> predictions list
  roadmaps: new Map<string, any>(), // roadmapId -> roadmap object
  roadmapMilestones: new Map<string, any>(), // milestoneId -> milestone object
  explanations: new Map<string, any>(), // key (userId_entityType_entityId) -> explanation object
};

// Seed default dev user in fallback store
async function seedDefaultFallbackUser() {
  const devEmail = "student@university.edu";
  if (!inMemoryStore.users.has(devEmail)) {
    const defaultPasswordHash = await bcrypt.hash("password123", 10);
    const devUserId = "usr_demo_101";
    const devUser = {
      id: devUserId,
      name: "Alex Rivera",
      email: devEmail,
      password_hash: defaultPasswordHash,
      role: "Graduate Student / Candidate",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryStore.users.set(devEmail, devUser);
    inMemoryStore.usersById.set(devUserId, devUser);
    inMemoryStore.profiles.set(devUserId, {
      id: uuidv4(),
      user_id: devUserId,
      phone: "+1 (555) 234-5678",
      location: "San Francisco, CA",
      education: "B.S. Computer Science & Engineering",
      experience_years: 1.5,
      target_role: "AI / Machine Learning Engineer",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

seedDefaultFallbackUser();

// Database initialization
export async function initDatabase() {
  try {
    const client = await pool.connect();
    isPostgresConnected = true;
    console.log("[PostgreSQL] Successfully connected to PostgreSQL database cluster.");

    // DDL Schema Setup
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          role VARCHAR(100) DEFAULT 'Graduate Student / Candidate',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          phone VARCHAR(50) DEFAULT '',
          location VARCHAR(255) DEFAULT '',
          education VARCHAR(255) DEFAULT '',
          experience_years NUMERIC(4, 2) DEFAULT 0.0,
          target_role VARCHAR(255) DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

      CREATE TABLE IF NOT EXISTS resumes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          original_filename VARCHAR(255) NOT NULL,
          stored_filename VARCHAR(255) NOT NULL DEFAULT '',
          file_path VARCHAR(512) NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          file_size_bytes BIGINT DEFAULT 0,
          extracted_text TEXT DEFAULT '',
          processing_status VARCHAR(50) DEFAULT 'uploaded',
          processing_error TEXT DEFAULT '',
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP WITH TIME ZONE NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

      -- Ensure existing columns if table existed
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS stored_filename VARCHAR(255) DEFAULT '';
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS extracted_text TEXT DEFAULT '';
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'uploaded';
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processing_error TEXT DEFAULT '';
      ALTER TABLE resumes ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE NULL;

      CREATE TABLE IF NOT EXISTS candidate_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          resume_id UUID UNIQUE NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
          summary TEXT DEFAULT '',
          roles JSONB DEFAULT '[]'::jsonb,
          processing_status VARCHAR(50) DEFAULT 'completed',
          processing_error TEXT DEFAULT '',
          analyzer_version VARCHAR(50) DEFAULT 'nlp-v1',
          analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_candidate_profiles_resume_id ON candidate_profiles(resume_id);

      CREATE TABLE IF NOT EXISTS candidate_skills (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
          skill_name VARCHAR(255) NOT NULL,
          normalized_name VARCHAR(255) NOT NULL,
          category VARCHAR(100) DEFAULT 'Other',
          original_text VARCHAR(255) DEFAULT '',
          confidence NUMERIC(3, 2) DEFAULT 0.90,
          source VARCHAR(100) DEFAULT 'extracted',
          is_user_corrected BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_candidate_skills_profile ON candidate_skills(candidate_profile_id);

      CREATE TABLE IF NOT EXISTS candidate_education (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
          degree VARCHAR(255) DEFAULT '',
          field VARCHAR(255) DEFAULT '',
          institution VARCHAR(255) DEFAULT '',
          start_year INT NULL,
          end_year INT NULL,
          score VARCHAR(100) DEFAULT '',
          raw_text TEXT DEFAULT '',
          confidence NUMERIC(3, 2) DEFAULT 0.90,
          is_user_corrected BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS candidate_experiences (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
          company VARCHAR(255) DEFAULT '',
          job_title VARCHAR(255) DEFAULT '',
          location VARCHAR(255) DEFAULT '',
          start_date VARCHAR(100) DEFAULT '',
          end_date VARCHAR(100) DEFAULT '',
          duration VARCHAR(100) DEFAULT '',
          description TEXT DEFAULT '',
          skills JSONB DEFAULT '[]'::jsonb,
          raw_text TEXT DEFAULT '',
          confidence NUMERIC(3, 2) DEFAULT 0.90,
          is_user_corrected BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS candidate_projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
          title VARCHAR(255) DEFAULT '',
          description TEXT DEFAULT '',
          technologies JSONB DEFAULT '[]'::jsonb,
          domain VARCHAR(255) DEFAULT '',
          link VARCHAR(512) DEFAULT '',
          raw_text TEXT DEFAULT '',
          confidence NUMERIC(3, 2) DEFAULT 0.90,
          is_user_corrected BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS candidate_certifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
          certification_name VARCHAR(255) DEFAULT '',
          issuing_organization VARCHAR(255) DEFAULT '',
          issue_date VARCHAR(100) DEFAULT '',
          credential_id VARCHAR(255) DEFAULT '',
          credential_url VARCHAR(512) DEFAULT '',
          raw_text TEXT DEFAULT '',
          confidence NUMERIC(3, 2) DEFAULT 0.90,
          is_user_corrected BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          location VARCHAR(255) DEFAULT 'Not specified',
          work_mode VARCHAR(50) DEFAULT 'Unknown',
          employment_type VARCHAR(50) DEFAULT 'Unknown',
          experience_min NUMERIC(4, 1) NULL,
          experience_max NUMERIC(4, 1) NULL,
          education_requirement VARCHAR(255) DEFAULT '',
          salary_min NUMERIC(12, 2) NULL,
          salary_max NUMERIC(12, 2) NULL,
          salary_currency VARCHAR(10) DEFAULT 'USD',
          application_url VARCHAR(512) DEFAULT '',
          source VARCHAR(100) DEFAULT 'manual',
          external_job_id VARCHAR(255) DEFAULT '',
          posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE,
          processing_status VARCHAR(50) DEFAULT 'completed',
          processing_error TEXT DEFAULT '',
          analyzer_version VARCHAR(50) DEFAULT 'job-nlp-v1',
          analyzed_at TIMESTAMP WITH TIME ZONE NULL
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
      CREATE INDEX IF NOT EXISTS idx_jobs_work_mode ON jobs(work_mode);
      CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);

      CREATE TABLE IF NOT EXISTS job_skills (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          skill_name VARCHAR(255) NOT NULL,
          normalized_name VARCHAR(255) NOT NULL,
          category VARCHAR(100) DEFAULT 'Other',
          skill_type VARCHAR(50) NOT NULL DEFAULT 'required',
          importance NUMERIC(3, 2) NULL,
          confidence NUMERIC(3, 2) DEFAULT 0.90,
          original_text TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_job_skills_job_id ON job_skills(job_id);

      CREATE TABLE IF NOT EXISTS job_education_requirements (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          degree VARCHAR(255) DEFAULT '',
          field VARCHAR(255) DEFAULT '',
          institution_type VARCHAR(255) DEFAULT '',
          required BOOLEAN DEFAULT TRUE,
          original_text TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_experience_requirements (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          minimum_years NUMERIC(4, 1) NULL,
          maximum_years NUMERIC(4, 1) NULL,
          job_role VARCHAR(255) DEFAULT '',
          original_text TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS matching_results (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
          job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
          model_name VARCHAR(255) NOT NULL,
          candidate_hash VARCHAR(64) DEFAULT '',
          job_hash VARCHAR(64) DEFAULT '',
          semantic_similarity NUMERIC(6, 4) NOT NULL,
          semantic_score INT NOT NULL,
          tfidf_similarity NUMERIC(6, 4) DEFAULT 0.0,
          tfidf_score INT DEFAULT 0,
          overall_score INT DEFAULT 0,
          skill_score INT DEFAULT 0,
          experience_score INT DEFAULT 0,
          education_score INT DEFAULT 0,
          ats_score INT DEFAULT 0,
          matched_required_skills JSONB DEFAULT '[]'::jsonb,
          missing_required_skills JSONB DEFAULT '[]'::jsonb,
          matched_preferred_skills JSONB DEFAULT '[]'::jsonb,
          missing_preferred_skills JSONB DEFAULT '[]'::jsonb,
          related_skills JSONB DEFAULT '[]'::jsonb,
          strengths JSONB DEFAULT '[]'::jsonb,
          weaknesses JSONB DEFAULT '[]'::jsonb,
          algorithm_version VARCHAR(100) DEFAULT 'hybrid-v1.0',
          weight_configuration JSONB DEFAULT '{}'::jsonb,
          component_scores JSONB DEFAULT '{}'::jsonb,
          explanation TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS overall_score INT DEFAULT 0;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS skill_score INT DEFAULT 0;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS experience_score INT DEFAULT 0;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS education_score INT DEFAULT 0;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS ats_score INT DEFAULT 0;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS matched_required_skills JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS missing_required_skills JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS matched_preferred_skills JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS missing_preferred_skills JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS related_skills JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS strengths JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS weaknesses JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS algorithm_version VARCHAR(100) DEFAULT 'hybrid-v1.0';
      ALTER TABLE matching_results ADD COLUMN IF NOT EXISTS weight_configuration JSONB DEFAULT '{}'::jsonb;

      CREATE INDEX IF NOT EXISTS idx_matching_lookup ON matching_results(user_id, resume_id, job_id, model_name);

      CREATE TABLE IF NOT EXISTS recommendations (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          resume_id VARCHAR(255) NOT NULL,
          job_id VARCHAR(255) NOT NULL,
          rank INT NOT NULL,
          overall_score NUMERIC(5,2) NOT NULL,
          semantic_score NUMERIC(5,2) NOT NULL,
          skill_score NUMERIC(5,2) NOT NULL,
          experience_score NUMERIC(5,2) NOT NULL,
          education_score NUMERIC(5,2) NOT NULL,
          ats_score NUMERIC(5,2) NOT NULL,
          preference_score NUMERIC(5,2) DEFAULT 0,
          matched_skills JSONB DEFAULT '[]'::jsonb,
          missing_skills JSONB DEFAULT '[]'::jsonb,
          recommendation_reason TEXT NOT NULL,
          algorithm_version VARCHAR(100) DEFAULT 'rec-hybrid-v1.0',
          generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_resume_job_alg UNIQUE (resume_id, job_id, algorithm_version)
      );

      CREATE INDEX IF NOT EXISTS idx_rec_lookup ON recommendations(user_id, resume_id, algorithm_version);

      CREATE TABLE IF NOT EXISTS career_predictions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id VARCHAR(255) NOT NULL,
          resume_id VARCHAR(255) NOT NULL,
          model_version VARCHAR(100) DEFAULT 'career-role-v1',
          role VARCHAR(255) NOT NULL,
          score NUMERIC(5, 2) NOT NULL,
          rank INT NOT NULL,
          category VARCHAR(100) DEFAULT '',
          description TEXT DEFAULT '',
          evidence JSONB DEFAULT '[]'::jsonb,
          matched_skills JSONB DEFAULT '[]'::jsonb,
          missing_skills JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_career_predictions_lookup ON career_predictions(user_id, resume_id);

      -- PHASE 10: CAREER ROADMAP TABLES
      CREATE TABLE IF NOT EXISTS career_roadmaps (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id VARCHAR(255) NOT NULL,
          resume_id VARCHAR(255) NOT NULL,
          target_role VARCHAR(255) NOT NULL,
          model_version VARCHAR(100) DEFAULT 'roadmap-v1.0',
          roadmap_version INT DEFAULT 1,
          duration_months INT DEFAULT 6,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE,
          data JSONB DEFAULT '{}'::jsonb
      );

      CREATE INDEX IF NOT EXISTS idx_career_roadmaps_lookup ON career_roadmaps(user_id, resume_id);

      CREATE TABLE IF NOT EXISTS roadmap_stages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          roadmap_id UUID REFERENCES career_roadmaps(id) ON DELETE CASCADE,
          stage_number INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT DEFAULT '',
          estimated_duration VARCHAR(100) DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS roadmap_milestones (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          stage_id UUID REFERENCES roadmap_stages(id) ON DELETE CASCADE,
          roadmap_id UUID REFERENCES career_roadmaps(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT DEFAULT '',
          completion_criteria TEXT DEFAULT '',
          status VARCHAR(50) DEFAULT 'not_started',
          progress_percentage INT DEFAULT 0,
          notes TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS roadmap_progress (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id VARCHAR(255) NOT NULL,
          roadmap_id UUID REFERENCES career_roadmaps(id) ON DELETE CASCADE,
          milestone_id UUID REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
          status VARCHAR(50) DEFAULT 'not_started',
          progress_percentage INT DEFAULT 0,
          started_at TIMESTAMP WITH TIME ZONE NULL,
          completed_at TIMESTAMP WITH TIME ZONE NULL,
          notes TEXT DEFAULT '',
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS explanations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id VARCHAR(255) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(255) NOT NULL,
          model_version VARCHAR(100) NOT NULL,
          explainer_type VARCHAR(100) NOT NULL,
          explanation_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_user_entity_explanation UNIQUE (user_id, entity_type, entity_id)
      );
    `);

    client.release();
    console.log("[PostgreSQL] Tables (users, user_profiles, resumes, candidate_profiles, jobs, job_skills, matching_results) verified and active.");
  } catch (err: any) {
    isPostgresConnected = false;
    console.warn(`[PostgreSQL Notice] PostgreSQL server connection state (${err.message}). Active state storage operational.`);
  }
}

// Data Access Methods

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (isPostgresConnected) {
    try {
      const res = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [normalizedEmail]);
      return res.rows[0] || null;
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }
  return inMemoryStore.users.get(normalizedEmail) || null;
}

export async function findUserById(id: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query("SELECT id, name, email, is_active, role, created_at, updated_at FROM users WHERE id = $1", [id]);
      return res.rows[0] || null;
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }
  return inMemoryStore.usersById.get(id) || null;
}

export async function createUser(name: string, email: string, passwordHash: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const newUserId = uuidv4();
  const now = new Date().toISOString();

  if (isPostgresConnected) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const userRes = await client.query(
        `INSERT INTO users (id, name, email, password_hash, is_active, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, 'Graduate Student / Candidate', NOW(), NOW())
         RETURNING id, name, email, is_active, role, created_at`,
        [newUserId, name.trim(), normalizedEmail, passwordHash]
      );

      // Create initial empty profile
      await client.query(
        `INSERT INTO user_profiles (id, user_id, phone, location, education, experience_years, target_role, created_at, updated_at)
         VALUES ($1, $2, '', '', '', 0.0, '', NOW(), NOW())`,
        [uuidv4(), newUserId]
      );

      await client.query("COMMIT");
      return userRes.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Fallback in-memory creation
  const newUser = {
    id: newUserId,
    name: name.trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
    is_active: true,
    role: "Graduate Student / Candidate",
    created_at: now,
    updated_at: now
  };

  inMemoryStore.users.set(normalizedEmail, newUser);
  inMemoryStore.usersById.set(newUserId, newUser);
  inMemoryStore.profiles.set(newUserId, {
    id: uuidv4(),
    user_id: newUserId,
    phone: "",
    location: "",
    education: "",
    experience_years: 0,
    target_role: "",
    created_at: now,
    updated_at: now
  });

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    is_active: newUser.is_active,
    role: newUser.role,
    created_at: newUser.created_at
  };
}

export async function getUserProfile(userId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query("SELECT * FROM user_profiles WHERE user_id = $1", [userId]);
      return res.rows[0] || null;
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }
  return inMemoryStore.profiles.get(userId) || null;
}

export async function updateUserProfile(userId: string, data: {
  phone?: string;
  location?: string;
  education?: string;
  experience_years?: number;
  target_role?: string;
}) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `UPDATE user_profiles
         SET phone = COALESCE($1, phone),
             location = COALESCE($2, location),
             education = COALESCE($3, education),
             experience_years = COALESCE($4, experience_years),
             target_role = COALESCE($5, target_role),
             updated_at = NOW()
         WHERE user_id = $6
         RETURNING *`,
        [data.phone, data.location, data.education, data.experience_years, data.target_role, userId]
      );
      return res.rows[0];
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }

  const existing = inMemoryStore.profiles.get(userId) || {
    id: uuidv4(),
    user_id: userId,
    created_at: new Date().toISOString()
  };

  const updated = {
    ...existing,
    phone: data.phone !== undefined ? data.phone : existing.phone,
    location: data.location !== undefined ? data.location : existing.location,
    education: data.education !== undefined ? data.education : existing.education,
    experience_years: data.experience_years !== undefined ? data.experience_years : existing.experience_years,
    target_role: data.target_role !== undefined ? data.target_role : existing.target_role,
    updated_at: new Date().toISOString()
  };

  inMemoryStore.profiles.set(userId, updated);
  return updated;
}

export async function createResumeRecord(
  userId: string,
  originalFilename: string,
  storedFilename: string,
  filePath: string,
  fileType: string,
  fileSize: number,
  extractedText: string = "",
  processingStatus: string = "completed",
  processingError: string = ""
) {
  const resumeId = uuidv4();
  const now = new Date().toISOString();
  const processedAt = processingStatus === "completed" || processingStatus === "failed" ? now : null;

  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `INSERT INTO resumes (id, user_id, original_filename, stored_filename, file_path, file_type, file_size_bytes, extracted_text, processing_status, processing_error, uploaded_at, processed_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, NOW())
         RETURNING id, user_id, original_filename, stored_filename, file_type, file_size_bytes, processing_status, processing_error, uploaded_at, processed_at`,
        [resumeId, userId, originalFilename, storedFilename, filePath, fileType, fileSize, extractedText, processingStatus, processingError, processedAt]
      );
      return res.rows[0];
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }

  const newResume = {
    id: resumeId,
    user_id: userId,
    original_filename: originalFilename,
    stored_filename: storedFilename,
    file_path: filePath,
    file_type: fileType,
    file_size_bytes: fileSize,
    extracted_text: extractedText,
    processing_status: processingStatus,
    processing_error: processingError,
    uploaded_at: now,
    processed_at: processedAt,
    updated_at: now
  };

  const existingResumes = inMemoryStore.resumes.get(userId) || [];
  existingResumes.push(newResume);
  inMemoryStore.resumes.set(userId, existingResumes);

  return newResume;
}

export async function getUserResumes(userId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT id, user_id, original_filename, stored_filename, file_type, file_size_bytes, processing_status, processing_error, uploaded_at, processed_at
         FROM resumes
         WHERE user_id = $1
         ORDER BY uploaded_at DESC`,
        [userId]
      );
      return res.rows;
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }
  
  const resumes = inMemoryStore.resumes.get(userId) || [];
  return resumes.map(({ extracted_text, ...rest }) => rest);
}

export async function getResumeById(userId: string, resumeId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT id, user_id, original_filename, stored_filename, file_type, file_size_bytes, processing_status, processing_error, uploaded_at, processed_at
         FROM resumes
         WHERE id = $1 AND user_id = $2`,
        [resumeId, userId]
      );
      return res.rows[0] || null;
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }

  const userResumes = inMemoryStore.resumes.get(userId) || [];
  const found = userResumes.find((r) => r.id === resumeId);
  if (!found) return null;
  const { extracted_text, ...rest } = found;
  return rest;
}

export async function getResumeText(userId: string, resumeId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT id, user_id, original_filename, extracted_text, processing_status, processing_error
         FROM resumes
         WHERE id = $1 AND user_id = $2`,
        [resumeId, userId]
      );
      return res.rows[0] || null;
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }

  const userResumes = inMemoryStore.resumes.get(userId) || [];
  const found = userResumes.find((r) => r.id === resumeId);
  if (!found) return null;
  return {
    id: found.id,
    user_id: found.user_id,
    original_filename: found.original_filename,
    extracted_text: found.extracted_text || "",
    processing_status: found.processing_status,
    processing_error: found.processing_error
  };
}

export async function deleteUserResume(userId: string, resumeId: string) {
  if (isPostgresConnected) {
    try {
      // IDOR protected check
      const checkRes = await pool.query("SELECT * FROM resumes WHERE id = $1 AND user_id = $2", [resumeId, userId]);
      if (checkRes.rows.length === 0) {
        return { success: false, fileToDelete: null };
      }
      const record = checkRes.rows[0];
      await pool.query("DELETE FROM resumes WHERE id = $1 AND user_id = $2", [resumeId, userId]);
      return { success: true, fileToDelete: record.file_path };
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }

  const existing = inMemoryStore.resumes.get(userId) || [];
  const idx = existing.findIndex((r) => r.id === resumeId);
  if (idx !== -1) {
    const record = existing[idx];
    existing.splice(idx, 1);
    inMemoryStore.resumes.set(userId, existing);
    return { success: true, fileToDelete: record.file_path };
  }
  return { success: false, fileToDelete: null };
}

export async function saveCandidateAnalysis(userId: string, resumeId: string, analysisData: any) {
  const now = new Date().toISOString();
  const profileId = uuidv4();

  if (isPostgresConnected) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete old analysis if re-analyzing
      await client.query("DELETE FROM candidate_profiles WHERE resume_id = $1 AND user_id = $2", [resumeId, userId]);

      // Insert candidate_profile
      const profRes = await client.query(
        `INSERT INTO candidate_profiles (id, user_id, resume_id, summary, roles, processing_status, processing_error, analyzer_version, analyzed_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
         RETURNING *`,
        [
          profileId,
          userId,
          resumeId,
          analysisData.summary || "",
          JSON.stringify(analysisData.roles || []),
          analysisData.processing_status || "completed",
          analysisData.processing_error || "",
          analysisData.analyzer_version || "nlp-v1"
        ]
      );

      // Insert Skills
      if (Array.isArray(analysisData.skills)) {
        for (const skill of analysisData.skills) {
          await client.query(
            `INSERT INTO candidate_skills (id, candidate_profile_id, skill_name, normalized_name, category, original_text, confidence, source, is_user_corrected)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              uuidv4(),
              profileId,
              skill.skill_name,
              skill.normalized_name,
              skill.category || "Other",
              skill.original_text || skill.skill_name,
              skill.confidence || 0.90,
              skill.source || "extracted",
              Boolean(skill.is_user_corrected)
            ]
          );
        }
      }

      // Insert Education
      if (Array.isArray(analysisData.education)) {
        for (const edu of analysisData.education) {
          await client.query(
            `INSERT INTO candidate_education (id, candidate_profile_id, degree, field, institution, start_year, end_year, score, raw_text, confidence, is_user_corrected)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              uuidv4(),
              profileId,
              edu.degree || "",
              edu.field || "",
              edu.institution || "",
              edu.start_year || null,
              edu.end_year || null,
              edu.score || "",
              edu.raw_text || "",
              edu.confidence || 0.90,
              Boolean(edu.is_user_corrected)
            ]
          );
        }
      }

      // Insert Experience
      if (Array.isArray(analysisData.experience)) {
        for (const exp of analysisData.experience) {
          await client.query(
            `INSERT INTO candidate_experiences (id, candidate_profile_id, company, job_title, location, start_date, end_date, duration, description, skills, raw_text, confidence, is_user_corrected)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              uuidv4(),
              profileId,
              exp.company || "",
              exp.job_title || "",
              exp.location || "",
              exp.start_date || "",
              exp.end_date || "",
              exp.duration || "",
              exp.description || "",
              JSON.stringify(exp.skills || []),
              exp.raw_text || "",
              exp.confidence || 0.90,
              Boolean(exp.is_user_corrected)
            ]
          );
        }
      }

      // Insert Projects
      if (Array.isArray(analysisData.projects)) {
        for (const proj of analysisData.projects) {
          await client.query(
            `INSERT INTO candidate_projects (id, candidate_profile_id, title, description, technologies, domain, link, raw_text, confidence, is_user_corrected)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              uuidv4(),
              profileId,
              proj.title || "",
              proj.description || "",
              JSON.stringify(proj.technologies || []),
              proj.domain || "",
              proj.link || "",
              proj.raw_text || "",
              proj.confidence || 0.90,
              Boolean(proj.is_user_corrected)
            ]
          );
        }
      }

      // Insert Certifications
      if (Array.isArray(analysisData.certifications)) {
        for (const cert of analysisData.certifications) {
          await client.query(
            `INSERT INTO candidate_certifications (id, candidate_profile_id, certification_name, issuing_organization, issue_date, credential_id, credential_url, raw_text, confidence, is_user_corrected)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              uuidv4(),
              profileId,
              cert.certification_name || "",
              cert.issuing_organization || "",
              cert.issue_date || "",
              cert.credential_id || "",
              cert.credential_url || "",
              cert.raw_text || "",
              cert.confidence || 0.90,
              Boolean(cert.is_user_corrected)
            ]
          );
        }
      }

      await client.query("COMMIT");
      return profRes.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("[PostgreSQL Query Error]:", e);
    } finally {
      client.release();
    }
  }

  // Fallback in-memory storage
  const record = {
    id: profileId,
    user_id: userId,
    resume_id: resumeId,
    summary: analysisData.summary || "",
    roles: analysisData.roles || [],
    skills: analysisData.skills || [],
    education: analysisData.education || [],
    experience: analysisData.experience || [],
    projects: analysisData.projects || [],
    certifications: analysisData.certifications || [],
    processing_status: analysisData.processing_status || "completed",
    processing_error: analysisData.processing_error || "",
    analyzer_version: analysisData.analyzer_version || "nlp-v1",
    analyzed_at: now,
    created_at: now,
    updated_at: now
  };

  inMemoryStore.candidateAnalyses.set(resumeId, record);
  return record;
}

export async function getCandidateAnalysis(userId: string, resumeId: string) {
  if (isPostgresConnected) {
    try {
      const profRes = await pool.query(
        "SELECT * FROM candidate_profiles WHERE resume_id = $1 AND user_id = $2",
        [resumeId, userId]
      );
      if (profRes.rows.length === 0) return null;

      const profile = profRes.rows[0];
      const profileId = profile.id;

      const [skillsRes, eduRes, expRes, projRes, certRes] = await Promise.all([
        pool.query("SELECT * FROM candidate_skills WHERE candidate_profile_id = $1", [profileId]),
        pool.query("SELECT * FROM candidate_education WHERE candidate_profile_id = $1", [profileId]),
        pool.query("SELECT * FROM candidate_experiences WHERE candidate_profile_id = $1", [profileId]),
        pool.query("SELECT * FROM candidate_projects WHERE candidate_profile_id = $1", [profileId]),
        pool.query("SELECT * FROM candidate_certifications WHERE candidate_profile_id = $1", [profileId])
      ]);

      return {
        id: profile.id,
        user_id: profile.user_id,
        resume_id: profile.resume_id,
        summary: profile.summary,
        roles: profile.roles || [],
        skills: skillsRes.rows,
        education: eduRes.rows,
        experience: expRes.rows,
        projects: projRes.rows,
        certifications: certRes.rows,
        processing_status: profile.processing_status,
        processing_error: profile.processing_error,
        analyzer_version: profile.analyzer_version,
        analyzed_at: profile.analyzed_at
      };
    } catch (e) {
      console.error("[PostgreSQL Query Error]:", e);
    }
  }

  return inMemoryStore.candidateAnalyses.get(resumeId) || null;
}

export async function updateCandidateAnalysis(userId: string, resumeId: string, updatedFields: any) {
  const existing = await getCandidateAnalysis(userId, resumeId);
  if (!existing) return null;

  const merged = {
    ...existing,
    summary: updatedFields.summary !== undefined ? updatedFields.summary : existing.summary,
    roles: updatedFields.roles !== undefined ? updatedFields.roles : existing.roles,
    skills: updatedFields.skills !== undefined ? updatedFields.skills : existing.skills,
    education: updatedFields.education !== undefined ? updatedFields.education : existing.education,
    experience: updatedFields.experience !== undefined ? updatedFields.experience : existing.experience,
    projects: updatedFields.projects !== undefined ? updatedFields.projects : existing.projects,
    certifications: updatedFields.certifications !== undefined ? updatedFields.certifications : existing.certifications,
    updated_at: new Date().toISOString()
  };

  return await saveCandidateAnalysis(userId, resumeId, merged);
}

export async function saveJobAnalysis(jobId: string, nlpResult: any) {
  const now = new Date().toISOString();

  if (isPostgresConnected) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update main job row with extracted properties
      await client.query(
        `UPDATE jobs
         SET work_mode = COALESCE($1, work_mode),
             employment_type = COALESCE($2, employment_type),
             experience_min = $3,
             experience_max = $4,
             education_requirement = $5,
             processing_status = 'completed',
             processing_error = '',
             analyzer_version = $6,
             analyzed_at = NOW(),
             updated_at = NOW()
         WHERE id = $7`,
        [
          nlpResult.work_mode || "Unknown",
          nlpResult.employment_type || "Unknown",
          nlpResult.experience_min ?? null,
          nlpResult.experience_max ?? null,
          nlpResult.education_requirement || "",
          nlpResult.analyzer_version || "job-nlp-v1",
          jobId
        ]
      );

      // Clean old extracted skills & requirements for re-analysis
      await client.query("DELETE FROM job_skills WHERE job_id = $1", [jobId]);
      await client.query("DELETE FROM job_education_requirements WHERE job_id = $1", [jobId]);
      await client.query("DELETE FROM job_experience_requirements WHERE job_id = $1", [jobId]);

      // Insert Skills
      if (Array.isArray(nlpResult.skills)) {
        for (const sk of nlpResult.skills) {
          await client.query(
            `INSERT INTO job_skills (id, job_id, skill_name, normalized_name, category, skill_type, importance, confidence, original_text)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              uuidv4(),
              jobId,
              sk.skill_name,
              sk.normalized_name,
              sk.category || "Other",
              sk.skill_type || "required",
              sk.importance ?? null,
              sk.confidence ?? 0.90,
              sk.original_text || sk.skill_name
            ]
          );
        }
      }

      // Insert Education
      if (Array.isArray(nlpResult.education)) {
        for (const edu of nlpResult.education) {
          await client.query(
            `INSERT INTO job_education_requirements (id, job_id, degree, field, institution_type, required, original_text)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              uuidv4(),
              jobId,
              edu.degree || "",
              edu.field || "",
              edu.institution_type || "",
              edu.required ?? true,
              edu.original_text || ""
            ]
          );
        }
      }

      // Insert Experience
      if (Array.isArray(nlpResult.experience)) {
        for (const exp of nlpResult.experience) {
          await client.query(
            `INSERT INTO job_experience_requirements (id, job_id, minimum_years, maximum_years, job_role, original_text)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              uuidv4(),
              jobId,
              exp.minimum_years ?? null,
              exp.maximum_years ?? null,
              exp.job_role || "",
              exp.original_text || ""
            ]
          );
        }
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("[PostgreSQL Query Error - saveJobAnalysis]:", e);
    } finally {
      client.release();
    }
  }

  // Update in-memory job store if fallback
  const existingJob = inMemoryStore.jobs.get(jobId);
  if (existingJob) {
    existingJob.work_mode = nlpResult.work_mode || existingJob.work_mode;
    existingJob.employment_type = nlpResult.employment_type || existingJob.employment_type;
    existingJob.experience_min = nlpResult.experience_min;
    existingJob.experience_max = nlpResult.experience_max;
    existingJob.education_requirement = nlpResult.education_requirement;
    existingJob.processing_status = "completed";
    existingJob.analyzed_at = now;
    existingJob.required_skills = nlpResult.required_skills || [];
    existingJob.preferred_skills = nlpResult.preferred_skills || [];
    inMemoryStore.jobs.set(jobId, existingJob);
  }

  const analysisRecord = {
    job_id: jobId,
    original_title: nlpResult.original_title,
    normalized_title: nlpResult.normalized_title,
    company: nlpResult.company,
    work_mode: nlpResult.work_mode,
    employment_type: nlpResult.employment_type,
    skills: nlpResult.skills || [],
    required_skills: nlpResult.required_skills || [],
    preferred_skills: nlpResult.preferred_skills || [],
    experience: nlpResult.experience || [],
    experience_min: nlpResult.experience_min,
    experience_max: nlpResult.experience_max,
    education: nlpResult.education || [],
    education_requirement: nlpResult.education_requirement,
    summary: nlpResult.summary || "",
    analyzer_version: nlpResult.analyzer_version || "job-nlp-v1",
    analyzed_at: now,
    processing_status: "completed"
  };

  inMemoryStore.jobAnalyses.set(jobId, analysisRecord);
  return analysisRecord;
}

export async function createJobRecord(data: {
  title: string;
  company: string;
  description: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  experience_min?: number;
  experience_max?: number;
  education_requirement?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  application_url?: string;
  source?: string;
  external_job_id?: string;
}) {
  const jobId = uuidv4();
  const now = new Date().toISOString();

  // Run initial NLP extraction on the job description
  const nlpResult = processJobNlp(
    data.title,
    data.company,
    data.description,
    data.work_mode,
    data.employment_type
  );

  const finalLocation = data.location || "Not specified";
  const finalWorkMode = nlpResult.work_mode;
  const finalEmploymentType = nlpResult.employment_type;
  const finalSource = data.source || "manual";
  const finalExternalId = data.external_job_id || "";

  // Duplicate Check
  if (isPostgresConnected) {
    try {
      let dupCheck;
      if (finalExternalId) {
        dupCheck = await pool.query("SELECT id FROM jobs WHERE external_job_id = $1 AND source = $2", [finalExternalId, finalSource]);
      } else {
        dupCheck = await pool.query(
          "SELECT id FROM jobs WHERE LOWER(company) = LOWER($1) AND LOWER(title) = LOWER($2) AND LEFT(description, 100) = LEFT($3, 100)",
          [data.company.trim(), data.title.trim(), data.description.trim()]
        );
      }
      if (dupCheck.rows.length > 0) {
        return { isDuplicate: true, existingId: dupCheck.rows[0].id };
      }

      const res = await pool.query(
        `INSERT INTO jobs (
          id, title, company, description, location, work_mode, employment_type,
          experience_min, experience_max, education_requirement, salary_min, salary_max,
          salary_currency, application_url, source, external_job_id, posted_at, created_at, updated_at,
          is_active, processing_status, analyzer_version, analyzed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16, NOW(), NOW(), NOW(),
          true, 'completed', 'job-nlp-v1', NOW()
        ) RETURNING *`,
        [
          jobId,
          data.title.trim(),
          data.company.trim(),
          data.description.trim(),
          finalLocation,
          finalWorkMode,
          finalEmploymentType,
          nlpResult.experience_min,
          nlpResult.experience_max,
          nlpResult.education_requirement,
          data.salary_min || null,
          data.salary_max || null,
          data.salary_currency || "USD",
          data.application_url || "",
          finalSource,
          finalExternalId
        ]
      );

      const jobRecord = res.rows[0];
      await saveJobAnalysis(jobId, nlpResult);
      return { isDuplicate: false, job: jobRecord };
    } catch (e) {
      console.error("[PostgreSQL Query Error - createJobRecord]:", e);
    }
  }

  // Fallback in-memory duplicate check
  for (const [id, existing] of inMemoryStore.jobs.entries()) {
    if (finalExternalId && existing.external_job_id === finalExternalId && existing.source === finalSource) {
      return { isDuplicate: true, existingId: id };
    }
    if (existing.company?.toLowerCase() === data.company.trim().toLowerCase() &&
        existing.title?.toLowerCase() === data.title.trim().toLowerCase() &&
        existing.description?.slice(0, 100) === data.description.trim().slice(0, 100)) {
      return { isDuplicate: true, existingId: id };
    }
  }

  const newJob = {
    id: jobId,
    title: data.title.trim(),
    company: data.company.trim(),
    description: data.description.trim(),
    location: finalLocation,
    work_mode: finalWorkMode,
    employment_type: finalEmploymentType,
    experience_min: nlpResult.experience_min,
    experience_max: nlpResult.experience_max,
    education_requirement: nlpResult.education_requirement,
    salary_min: data.salary_min || null,
    salary_max: data.salary_max || null,
    salary_currency: data.salary_currency || "USD",
    application_url: data.application_url || "",
    source: finalSource,
    external_job_id: finalExternalId,
    posted_at: now,
    created_at: now,
    updated_at: now,
    is_active: true,
    processing_status: "completed",
    required_skills: nlpResult.required_skills,
    preferred_skills: nlpResult.preferred_skills
  };

  inMemoryStore.jobs.set(jobId, newJob);
  await saveJobAnalysis(jobId, nlpResult);

  return { isDuplicate: false, job: newJob };
}

export async function getJobsList(filters: {
  search?: string;
  location?: string;
  work_mode?: string;
  employment_type?: string;
  page?: number;
  page_size?: number;
}) {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(50, Math.max(1, filters.page_size || 10));
  const offset = (page - 1) * pageSize;

  if (isPostgresConnected) {
    try {
      let whereClauses: string[] = ["is_active = true"];
      let params: any[] = [];
      let pIdx = 1;

      if (filters.search && filters.search.trim()) {
        whereClauses.push(`(title ILIKE $${pIdx} OR company ILIKE $${pIdx} OR description ILIKE $${pIdx})`);
        params.push(`%${filters.search.trim()}%`);
        pIdx++;
      }

      if (filters.work_mode && filters.work_mode !== "All") {
        whereClauses.push(`work_mode = $${pIdx}`);
        params.push(filters.work_mode);
        pIdx++;
      }

      if (filters.employment_type && filters.employment_type !== "All") {
        whereClauses.push(`employment_type = $${pIdx}`);
        params.push(filters.employment_type);
        pIdx++;
      }

      if (filters.location && filters.location !== "All") {
        whereClauses.push(`location ILIKE $${pIdx}`);
        params.push(`%${filters.location.trim()}%`);
        pIdx++;
      }

      const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

      const countRes = await pool.query(`SELECT COUNT(*) FROM jobs ${whereSql}`, params);
      const totalCount = parseInt(countRes.rows[0].count, 10);

      const jobsRes = await pool.query(
        `SELECT id, title, company, description, location, work_mode, employment_type,
                experience_min, experience_max, education_requirement, salary_min, salary_max,
                salary_currency, application_url, source, external_job_id, posted_at, created_at, processing_status
         FROM jobs
         ${whereSql}
         ORDER BY posted_at DESC
         LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
        [...params, pageSize, offset]
      );

      // Attach skills for each job in list
      const jobsWithSkills = await Promise.all(
        jobsRes.rows.map(async (j) => {
          const skRes = await pool.query("SELECT skill_name, skill_type FROM job_skills WHERE job_id = $1", [j.id]);
          const reqSkills = skRes.rows.filter(s => s.skill_type === "required").map(s => s.skill_name);
          const prefSkills = skRes.rows.filter(s => s.skill_type === "preferred").map(s => s.skill_name);
          return {
            ...j,
            required_skills: reqSkills,
            preferred_skills: prefSkills
          };
        })
      );

      return {
        jobs: jobsWithSkills,
        total: totalCount,
        page,
        page_size: pageSize,
        total_pages: Math.ceil(totalCount / pageSize) || 1
      };
    } catch (e) {
      console.error("[PostgreSQL Query Error - getJobsList]:", e);
    }
  }

  // Fallback in-memory list filtering
  let allJobs = Array.from(inMemoryStore.jobs.values());

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    allJobs = allJobs.filter((j) =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.description.toLowerCase().includes(q)
    );
  }

  if (filters.work_mode && filters.work_mode !== "All") {
    allJobs = allJobs.filter((j) => j.work_mode === filters.work_mode);
  }

  if (filters.employment_type && filters.employment_type !== "All") {
    allJobs = allJobs.filter((j) => j.employment_type === filters.employment_type);
  }

  if (filters.location && filters.location !== "All") {
    const locQ = filters.location.trim().toLowerCase();
    allJobs = allJobs.filter((j) => j.location.toLowerCase().includes(locQ));
  }

  const total = allJobs.length;
  const paginated = allJobs.slice(offset, offset + pageSize);

  return {
    jobs: paginated,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize) || 1
  };
}

export async function getJobById(jobId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
      if (res.rows.length === 0) return null;
      const job = res.rows[0];

      const [skillsRes, eduRes, expRes] = await Promise.all([
        pool.query("SELECT * FROM job_skills WHERE job_id = $1", [jobId]),
        pool.query("SELECT * FROM job_education_requirements WHERE job_id = $1", [jobId]),
        pool.query("SELECT * FROM job_experience_requirements WHERE job_id = $1", [jobId])
      ]);

      return {
        ...job,
        skills: skillsRes.rows,
        required_skills: skillsRes.rows.filter(s => s.skill_type === "required").map(s => s.skill_name),
        preferred_skills: skillsRes.rows.filter(s => s.skill_type === "preferred").map(s => s.skill_name),
        education_details: eduRes.rows,
        experience_details: expRes.rows
      };
    } catch (e) {
      console.error("[PostgreSQL Query Error - getJobById]:", e);
    }
  }

  const job = inMemoryStore.jobs.get(jobId);
  if (!job) return null;

  const analysis = inMemoryStore.jobAnalyses.get(jobId);
  return {
    ...job,
    skills: analysis ? analysis.skills : [],
    required_skills: job.required_skills || (analysis ? analysis.required_skills : []),
    preferred_skills: job.preferred_skills || (analysis ? analysis.preferred_skills : []),
    education_details: analysis ? analysis.education : [],
    experience_details: analysis ? analysis.experience : []
  };
}

export async function deleteJobRecord(jobId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query("DELETE FROM jobs WHERE id = $1 RETURNING id", [jobId]);
      return res.rows.length > 0;
    } catch (e) {
      console.error("[PostgreSQL Query Error - deleteJobRecord]:", e);
    }
  }

  const existed = inMemoryStore.jobs.has(jobId);
  inMemoryStore.jobs.delete(jobId);
  inMemoryStore.jobAnalyses.delete(jobId);
  return existed;
}

export async function getJobAnalysis(jobId: string) {
  if (isPostgresConnected) {
    try {
      const jobRes = await pool.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
      if (jobRes.rows.length === 0) return null;
      const job = jobRes.rows[0];

      const [skillsRes, eduRes, expRes] = await Promise.all([
        pool.query("SELECT * FROM job_skills WHERE job_id = $1", [jobId]),
        pool.query("SELECT * FROM job_education_requirements WHERE job_id = $1", [jobId]),
        pool.query("SELECT * FROM job_experience_requirements WHERE job_id = $1", [jobId])
      ]);

      const reqSkills = skillsRes.rows.filter(s => s.skill_type === "required").map(s => s.skill_name);
      const prefSkills = skillsRes.rows.filter(s => s.skill_type === "preferred").map(s => s.skill_name);

      return {
        job_id: job.id,
        original_title: job.title,
        normalized_title: job.title,
        company: job.company,
        work_mode: job.work_mode,
        employment_type: job.employment_type,
        skills: skillsRes.rows,
        required_skills: reqSkills,
        preferred_skills: prefSkills,
        experience: expRes.rows,
        experience_min: job.experience_min,
        experience_max: job.experience_max,
        education: eduRes.rows,
        education_requirement: job.education_requirement,
        summary: `Role: ${job.title}\nCompany: ${job.company}\nWork Mode: ${job.work_mode}\nEmployment Type: ${job.employment_type}\nRequired Skills: ${reqSkills.join(", ")}`,
        processing_status: job.processing_status,
        analyzed_at: job.analyzed_at
      };
    } catch (e) {
      console.error("[PostgreSQL Query Error - getJobAnalysis]:", e);
    }
  }

  return inMemoryStore.jobAnalyses.get(jobId) || null;
}

export async function importJobsBulk(jobsList: any[]) {
  let importedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (let idx = 0; idx < jobsList.length; idx++) {
    const item = jobsList[idx];
    if (!item.title || !item.company || !item.description) {
      errors.push(`Row ${idx + 1}: Missing required fields (title, company, or description).`);
      skippedCount++;
      continue;
    }

    const res = await createJobRecord({
      title: item.title,
      company: item.company,
      description: item.description,
      location: item.location || "Not specified",
      work_mode: item.work_mode,
      employment_type: item.employment_type,
      salary_min: item.salary_min ? parseFloat(item.salary_min) : undefined,
      salary_max: item.salary_max ? parseFloat(item.salary_max) : undefined,
      application_url: item.application_url || item.link || "",
      source: "imported_file",
      external_job_id: item.external_job_id || item.id || ""
    });

    if (res.isDuplicate) {
      skippedCount++;
    } else {
      importedCount++;
    }
  }

  return {
    success: true,
    imported: importedCount,
    skipped: skippedCount,
    errors
  };
}

export async function seedBenchmarkJobsIfEmpty() {
  const currentList = await getJobsList({ page: 1, page_size: 1 });
  if (currentList.total > 0) return;

  const benchmarkJobs = [
    {
      title: "Senior Machine Learning Engineer",
      company: "Aether AI Labs",
      location: "San Francisco, CA",
      work_mode: "Hybrid",
      employment_type: "Full-time",
      description: "We are seeking a Senior Machine Learning Engineer to design, train, and deploy large-scale NLP and computer vision models.\n\nRequired Qualifications:\n- Strong proficiency in Python, PyTorch, and TensorFlow.\n- 3-5 years of hands-on experience developing production ML pipelines.\n- Solid understanding of SQL, PostgreSQL, Docker, and Kubernetes.\n- Bachelor's degree in Computer Science, Data Science, or related technical field.\n\nPreferred Qualifications:\n- Experience with AWS (EC2, SageMaker) is a plus.\n- Familiarity with MLOps frameworks like MLflow or Kubeflow."
    },
    {
      title: "Full Stack Software Engineer",
      company: "CloudScale Systems",
      location: "Austin, TX",
      work_mode: "Remote",
      employment_type: "Full-time",
      description: "Looking for a versatile Full Stack Developer to build user-facing cloud management dashboards.\n\nResponsibilities:\n- Develop responsive React, TypeScript UI interfaces.\n- Build resilient REST APIs with Node.js, Express, and PostgreSQL.\n\nMinimum Requirements:\n- 2-4 years of full stack software development experience.\n- Deep knowledge of JavaScript, TypeScript, React, HTML5, CSS3, Tailwind CSS.\n- Hands-on experience with Git, Docker, and CI/CD pipelines.\n- Bachelor's in CS or equivalent experience."
    },
    {
      title: "Data Scientist - Predictive Analytics",
      company: "DataPulse Analytics",
      location: "New York, NY",
      work_mode: "On-site",
      employment_type: "Full-time",
      description: "Join our data science group to build statistical models and customer behavioral analytics.\n\nRequirements:\n- Master's or Ph.D in Computer Science, Statistics, or Mathematics.\n- 2+ years of experience with Python, R, Pandas, NumPy, and Scikit-Learn.\n- Mastery in SQL queries and data warehouse modeling.\n- Experience with Tableau or PowerBI for business visualization."
    },
    {
      title: "DevOps & Cloud Infrastructure Engineer",
      company: "NextGen Cloud Inc.",
      location: "Seattle, WA",
      work_mode: "Remote",
      employment_type: "Full-time",
      description: "Seeking a Cloud Engineer to lead automated infrastructure provisioning and observability.\n\nRequirements:\n- 3 to 5 years of experience in Cloud Architecture.\n- Deep expertise in AWS, Terraform, Docker, Kubernetes, and Linux shell scripting.\n- Strong background in Python or Go for infrastructure tooling."
    }
  ];

  for (const bj of benchmarkJobs) {
    await createJobRecord(bj);
  }
}

export function getDatabaseStatus() {
  return {
    isPostgresConnected,
    databaseUrl: databaseUrl.replace(/:[^:@]+@/, ":****@"), // sanitize password in status
  };
}

// ================================================================
// PHASE 6: MATCHING RESULTS DATABASE FUNCTIONS
// ================================================================

export async function saveMatchingResult(matchData: {
  user_id: string;
  resume_id: string;
  job_id: string;
  model_name: string;
  candidate_hash: string;
  job_hash: string;
  semantic_similarity: number;
  semantic_score: number;
  tfidf_similarity?: number;
  tfidf_score?: number;
  overall_score?: number;
  skill_score?: number;
  experience_score?: number;
  education_score?: number;
  ats_score?: number;
  matched_required_skills?: string[];
  missing_required_skills?: string[];
  matched_preferred_skills?: string[];
  missing_preferred_skills?: string[];
  related_skills?: any[];
  strengths?: string[];
  weaknesses?: string[];
  algorithm_version?: string;
  weight_configuration?: any;
  component_scores?: any;
  explanation: string;
}) {
  const matchId = uuidv4();
  const now = new Date().toISOString();

  const overall = matchData.overall_score ?? matchData.semantic_score;
  const skill = matchData.skill_score ?? 0;
  const exp = matchData.experience_score ?? 0;
  const edu = matchData.education_score ?? 0;
  const ats = matchData.ats_score ?? 0;
  const algVer = matchData.algorithm_version || "hybrid-v1.0";

  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `INSERT INTO matching_results 
         (id, user_id, resume_id, job_id, model_name, candidate_hash, job_hash, 
          semantic_similarity, semantic_score, tfidf_similarity, tfidf_score,
          overall_score, skill_score, experience_score, education_score, ats_score,
          matched_required_skills, missing_required_skills, matched_preferred_skills, missing_preferred_skills,
          related_skills, strengths, weaknesses, algorithm_version, weight_configuration,
          component_scores, explanation, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, NOW(), NOW())
         RETURNING *`,
        [
          matchId,
          matchData.user_id,
          matchData.resume_id,
          matchData.job_id,
          matchData.model_name,
          matchData.candidate_hash,
          matchData.job_hash,
          matchData.semantic_similarity,
          matchData.semantic_score,
          matchData.tfidf_similarity || 0.0,
          matchData.tfidf_score || 0,
          overall,
          skill,
          exp,
          edu,
          ats,
          JSON.stringify(matchData.matched_required_skills || []),
          JSON.stringify(matchData.missing_required_skills || []),
          JSON.stringify(matchData.matched_preferred_skills || []),
          JSON.stringify(matchData.missing_preferred_skills || []),
          JSON.stringify(matchData.related_skills || []),
          JSON.stringify(matchData.strengths || []),
          JSON.stringify(matchData.weaknesses || []),
          algVer,
          JSON.stringify(matchData.weight_configuration || {}),
          JSON.stringify(matchData.component_scores || {}),
          matchData.explanation
        ]
      );
      return res.rows[0];
    } catch (e) {
      console.error("[Save Matching Result Error]:", e);
    }
  }

  // In-memory fallback
  const record = {
    id: matchId,
    ...matchData,
    overall_score: overall,
    skill_score: skill,
    experience_score: exp,
    education_score: edu,
    ats_score: ats,
    algorithm_version: algVer,
    created_at: now,
    updated_at: now
  };
  const key = `${matchData.user_id}_${matchData.resume_id}_${matchData.job_id}_${matchData.model_name}`;
  inMemoryStore.matchingResults.set(key, record);
  return record;
}

export async function getCachedMatchingResult(
  userId: string,
  resumeId: string,
  jobId: string,
  modelName: string,
  candidateHash: string,
  jobHash: string
) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT * FROM matching_results 
         WHERE user_id = $1 AND resume_id = $2 AND job_id = $3 AND model_name = $4 
           AND candidate_hash = $5 AND job_hash = $6 
         ORDER BY created_at DESC LIMIT 1`,
        [userId, resumeId, jobId, modelName, candidateHash, jobHash]
      );
      return res.rows[0] || null;
    } catch (e) {
      console.error("[Get Cached Matching Error]:", e);
    }
  }

  // Fallback
  const key = `${userId}_${resumeId}_${jobId}_${modelName}`;
  const cached = inMemoryStore.matchingResults.get(key);
  if (cached && cached.candidate_hash === candidateHash && cached.job_hash === jobHash) {
    return cached;
  }
  return null;
}

export async function getMatchingResultById(userId: string, matchId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT * FROM matching_results WHERE user_id = $1 AND id = $2 LIMIT 1`,
        [userId, matchId]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (e) {
      console.error("[Get Matching Result By ID Error]:", e);
    }
  }

  // Fallback
  for (const record of inMemoryStore.matchingResults.values()) {
    if (record.user_id === userId && record.id === matchId) {
      return record;
    }
  }
  return null;
}

export async function getUserMatchingHistory(userId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT m.*, r.original_filename as resume_name, j.title as job_title, j.company as job_company
         FROM matching_results m
         JOIN resumes r ON m.resume_id = r.id
         JOIN jobs j ON m.job_id = j.id
         WHERE m.user_id = $1
         ORDER BY m.created_at DESC`,
        [userId]
      );
      return res.rows;
    } catch (e) {
      console.error("[Get Matching History Error]:", e);
    }
  }

  // Fallback
  const history: any[] = [];
  for (const record of inMemoryStore.matchingResults.values()) {
    if (record.user_id === userId) {
      const job = inMemoryStore.jobs.get(record.job_id);
      let resumeName = "Resume Document";
      const userResumes = inMemoryStore.resumes.get(userId) || [];
      const foundRes = userResumes.find((r: any) => r.id === record.resume_id);
      if (foundRes) resumeName = foundRes.original_filename;

      history.push({
        ...record,
        resume_name: resumeName,
        job_title: job ? job.title : "Target Role",
        job_company: job ? job.company : "Company"
      });
    }
  }
  return history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ================================================================
// PHASE 8: RECOMMENDATIONS DATABASE FUNCTIONS
// ================================================================

export async function saveRecommendations(
  userId: string,
  resumeId: string,
  algorithmVersion: string,
  recommendationsList: any[]
) {
  const now = new Date().toISOString();

  if (isPostgresConnected) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "DELETE FROM recommendations WHERE user_id = $1 AND resume_id = $2 AND algorithm_version = $3",
        [userId, resumeId, algorithmVersion]
      );

      for (const rec of recommendationsList) {
        const recId = rec.id || uuidv4();
        await client.query(
          `INSERT INTO recommendations (
            id, user_id, resume_id, job_id, rank, overall_score, semantic_score,
            skill_score, experience_score, education_score, ats_score, preference_score,
            matched_skills, missing_skills, recommendation_reason, algorithm_version,
            generated_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
          [
            recId,
            userId,
            resumeId,
            rec.job_id,
            rec.rank,
            rec.overall_score,
            rec.semantic_score,
            rec.skill_score,
            rec.experience_score,
            rec.education_score,
            rec.ats_score,
            rec.preference_score || 0,
            JSON.stringify(rec.matched_skills || []),
            JSON.stringify(rec.missing_skills || []),
            rec.recommendation_reason || rec.reason || "",
            algorithmVersion
          ]
        );
      }

      await client.query("COMMIT");
      client.release();
      return true;
    } catch (e) {
      await client.query("ROLLBACK");
      client.release();
      console.error("[Save Recommendations Error]:", e);
    }
  }

  // Fallback
  const key = `${userId}_${resumeId}_${algorithmVersion}`;
  const mapped = recommendationsList.map((rec) => ({
    id: rec.id || uuidv4(),
    user_id: userId,
    resume_id: resumeId,
    job_id: rec.job_id,
    rank: rec.rank,
    overall_score: rec.overall_score,
    semantic_score: rec.semantic_score,
    skill_score: rec.skill_score,
    experience_score: rec.experience_score,
    education_score: rec.education_score,
    ats_score: rec.ats_score,
    preference_score: rec.preference_score || 0,
    matched_skills: rec.matched_skills || [],
    missing_skills: rec.missing_skills || [],
    recommendation_reason: rec.recommendation_reason || rec.reason || "",
    algorithm_version: algorithmVersion,
    generated_at: now,
    updated_at: now
  }));
  inMemoryStore.recommendations.set(key, mapped);
  return true;
}

export async function getStoredRecommendations(
  userId: string,
  resumeId: string,
  algorithmVersion: string
) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT r.*, j.title as job_title, j.company as job_company, j.location as job_location, 
                j.work_mode as job_work_mode, j.employment_type as job_employment_type,
                j.description as job_description, j.posted_at as job_posted_at, j.application_url
         FROM recommendations r
         JOIN jobs j ON r.job_id = j.id
         WHERE r.user_id = $1 AND r.resume_id = $2 AND r.algorithm_version = $3
         ORDER BY r.rank ASC`,
        [userId, resumeId, algorithmVersion]
      );
      return res.rows;
    } catch (e) {
      console.error("[Get Stored Recommendations Error]:", e);
    }
  }

  // Fallback
  const key = `${userId}_${resumeId}_${algorithmVersion}`;
  const recs = inMemoryStore.recommendations.get(key);
  if (!recs) return null;

  return recs.map((r) => {
    const job = inMemoryStore.jobs.get(r.job_id);
    return {
      ...r,
      job_title: job ? job.title : "Target Position",
      job_company: job ? job.company : "Company",
      job_location: job ? job.location : "Location",
      job_work_mode: job ? job.work_mode : "Hybrid",
      job_employment_type: job ? job.employment_type : "Full-time",
      job_description: job ? job.description : "",
      job_posted_at: job ? job.posted_at : r.generated_at,
      application_url: job ? job.application_url : ""
    };
  });
}

export async function deleteStoredRecommendations(userId: string, resumeId: string) {
  if (isPostgresConnected) {
    try {
      await pool.query("DELETE FROM recommendations WHERE user_id = $1 AND resume_id = $2", [userId, resumeId]);
      return true;
    } catch (e) {
      console.error("[Delete Recommendations Error]:", e);
    }
  }

  for (const key of Array.from(inMemoryStore.recommendations.keys())) {
    if (key.startsWith(`${userId}_${resumeId}_`)) {
      inMemoryStore.recommendations.delete(key);
    }
  }
  return true;
}

export async function saveCareerPredictions(
  userId: string,
  resumeId: string,
  modelVersion: string,
  predictionsList: any[]
) {
  const now = new Date().toISOString();
  if (isPostgresConnected) {
    try {
      await pool.query("DELETE FROM career_predictions WHERE user_id = $1 AND resume_id = $2", [userId, resumeId]);
      for (const p of predictionsList) {
        await pool.query(
          `INSERT INTO career_predictions 
           (user_id, resume_id, model_version, role, score, rank, category, description, evidence, matched_skills, missing_skills, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            userId,
            resumeId,
            modelVersion,
            p.role,
            p.score,
            p.rank,
            p.category || "",
            p.description || "",
            JSON.stringify(p.evidence_signals || []),
            JSON.stringify(p.matched_skills || []),
            JSON.stringify(p.missing_skills || []),
            now
          ]
        );
      }
      return true;
    } catch (e) {
      console.error("[Save Career Predictions Error]:", e);
    }
  }

  // Fallback
  const mapped = predictionsList.map((p) => ({
    id: uuidv4(),
    user_id: userId,
    resume_id: resumeId,
    model_version: modelVersion,
    role: p.role,
    score: p.score,
    rank: p.rank,
    category: p.category || "",
    description: p.description || "",
    evidence_signals: p.evidence_signals || [],
    matched_skills: p.matched_skills || [],
    missing_skills: p.missing_skills || [],
    created_at: now
  }));
  inMemoryStore.careerPredictions.set(resumeId, mapped);
  return true;
}

export async function getCareerPredictionsByResume(resumeId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT * FROM career_predictions WHERE resume_id = $1 ORDER BY rank ASC`,
        [resumeId]
      );
      return res.rows;
    } catch (e) {
      console.error("[Get Career Predictions Error]:", e);
    }
  }

  return inMemoryStore.careerPredictions.get(resumeId) || [];
}

// ================================================================
// PHASE 10: CAREER ROADMAP DATABASE FUNCTIONS
// ================================================================

export async function saveRoadmapRecord(
  userId: string,
  resumeId: string,
  targetRole: string,
  durationMonths: number,
  roadmapData: any
) {
  const now = new Date().toISOString();

  if (isPostgresConnected) {
    try {
      // Mark previous roadmaps for this resume as inactive
      await pool.query(
        `UPDATE career_roadmaps SET is_active = FALSE WHERE user_id = $1 AND resume_id = $2`,
        [userId, resumeId]
      );

      // Insert new roadmap record
      await pool.query(
        `INSERT INTO career_roadmaps (
          id, user_id, resume_id, target_role, model_version, roadmap_version, duration_months, created_at, updated_at, is_active, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), TRUE, $8)`,
        [
          roadmapData.id,
          userId,
          resumeId,
          targetRole,
          roadmapData.model_version || "roadmap-v1.0",
          roadmapData.roadmap_version || 1,
          durationMonths,
          JSON.stringify(roadmapData)
        ]
      );

      return true;
    } catch (e) {
      console.error("[Save Roadmap Error]:", e);
    }
  }

  // Fallback in-memory
  // Deactivate previous
  for (const [rId, rm] of inMemoryStore.roadmaps.entries()) {
    if (rm.user_id === userId && rm.resume_id === resumeId) {
      rm.is_active = false;
    }
  }

  inMemoryStore.roadmaps.set(roadmapData.id, roadmapData);

  // Store milestones in in-memory map for quick milestone updates
  for (const stage of roadmapData.stages || []) {
    for (const ms of stage.milestones || []) {
      inMemoryStore.roadmapMilestones.set(ms.id, {
        ...ms,
        roadmap_id: roadmapData.id,
        user_id: userId
      });
    }
  }

  return true;
}

export async function getRoadmapRecordById(userId: string, roadmapId: string) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT * FROM career_roadmaps WHERE id = $1 AND user_id = $2`,
        [roadmapId, userId]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const rawData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
        return {
          ...rawData,
          is_active: row.is_active
        };
      }
      return null;
    } catch (e) {
      console.error("[Get Roadmap By Id Error]:", e);
    }
  }

  const rm = inMemoryStore.roadmaps.get(roadmapId);
  if (rm && rm.user_id === userId) {
    return rm;
  }
  return null;
}

export async function getUserRoadmapsRecord(userId: string, resumeId?: string) {
  if (isPostgresConnected) {
    try {
      let query = `SELECT * FROM career_roadmaps WHERE user_id = $1`;
      const params: any[] = [userId];

      if (resumeId) {
        query += ` AND resume_id = $2`;
        params.push(resumeId);
      }

      query += ` ORDER BY created_at DESC`;

      const res = await pool.query(query, params);
      return res.rows.map((row) => {
        const rawData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
        return {
          ...rawData,
          is_active: row.is_active
        };
      });
    } catch (e) {
      console.error("[Get User Roadmaps Error]:", e);
    }
  }

  const userRoadmaps: any[] = [];
  for (const rm of inMemoryStore.roadmaps.values()) {
    if (rm.user_id === userId) {
      if (!resumeId || rm.resume_id === resumeId) {
        userRoadmaps.push(rm);
      }
    }
  }
  return userRoadmaps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateMilestoneProgressRecord(
  userId: string,
  milestoneId: string,
  status: "not_started" | "in_progress" | "completed",
  progressPercentage: number,
  notes: string = ""
) {
  const now = new Date().toISOString();

  if (isPostgresConnected) {
    try {
      // Get milestone to ensure user ownership
      const msRes = await pool.query(
        `SELECT m.*, r.user_id 
         FROM roadmap_milestones m 
         JOIN career_roadmaps r ON m.roadmap_id = r.id 
         WHERE m.id = $1 AND r.user_id = $2`,
        [milestoneId, userId]
      );

      if (msRes.rows.length === 0) {
        // Check if stored in roadmap JSON data
        const rmRes = await pool.query(`SELECT * FROM career_roadmaps WHERE user_id = $1`, [userId]);
        let foundRoadmap: any = null;
        let targetMilestone: any = null;

        for (const row of rmRes.rows) {
          const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          for (const stage of data.stages || []) {
            for (const ms of stage.milestones || []) {
              if (ms.id === milestoneId) {
                foundRoadmap = data;
                targetMilestone = ms;
                break;
              }
            }
          }
          if (foundRoadmap) break;
        }

        if (!foundRoadmap) {
          throw new Error("Milestone not found or access denied.");
        }

        // Update JSON structure
        let totalMilestonesCount = 0;
        let completedMilestonesCount = 0;

        for (const stage of foundRoadmap.stages) {
          for (const ms of stage.milestones) {
            totalMilestonesCount++;
            if (ms.id === milestoneId) {
              ms.status = status;
              ms.progress_percentage = progressPercentage;
              ms.notes = notes;
            }
            if (ms.status === "completed" || ms.progress_percentage === 100) {
              completedMilestonesCount++;
            }
          }
        }

        foundRoadmap.overall_progress = Math.round(
          (completedMilestonesCount / Math.max(1, totalMilestonesCount)) * 100
        );
        foundRoadmap.updated_at = now;

        await pool.query(
          `UPDATE career_roadmaps SET data = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
          [JSON.stringify(foundRoadmap), foundRoadmap.id, userId]
        );

        return {
          milestone_id: milestoneId,
          status,
          progress_percentage: progressPercentage,
          notes,
          overall_progress: foundRoadmap.overall_progress,
          updated_at: now
        };
      }
    } catch (e) {
      console.error("[Update Milestone Error]:", e);
    }
  }

  // Fallback in-memory
  let targetMilestone = inMemoryStore.roadmapMilestones.get(milestoneId);
  let parentRoadmap: any = null;

  if (!targetMilestone) {
    // Search in roadmaps store
    for (const rm of inMemoryStore.roadmaps.values()) {
      if (rm.user_id === userId) {
        for (const stage of rm.stages || []) {
          for (const ms of stage.milestones || []) {
            if (ms.id === milestoneId) {
              targetMilestone = ms;
              parentRoadmap = rm;
              break;
            }
          }
        }
      }
      if (targetMilestone) break;
    }
  } else {
    parentRoadmap = inMemoryStore.roadmaps.get(targetMilestone.roadmap_id);
  }

  if (!targetMilestone || (parentRoadmap && parentRoadmap.user_id !== userId)) {
    throw new Error("Milestone not found or access denied.");
  }

  targetMilestone.status = status;
  targetMilestone.progress_percentage = progressPercentage;
  targetMilestone.notes = notes;

  if (parentRoadmap) {
    let totalMs = 0;
    let completedMs = 0;

    for (const stage of parentRoadmap.stages || []) {
      for (const ms of stage.milestones || []) {
        totalMs++;
        if (ms.id === milestoneId) {
          ms.status = status;
          ms.progress_percentage = progressPercentage;
          ms.notes = notes;
        }
        if (ms.status === "completed" || ms.progress_percentage === 100) {
          completedMs++;
        }
      }
    }

    parentRoadmap.overall_progress = Math.round((completedMs / Math.max(1, totalMs)) * 100);
    parentRoadmap.updated_at = now;
  }

  return {
    milestone_id: milestoneId,
    status,
    progress_percentage: progressPercentage,
    notes,
    overall_progress: parentRoadmap ? parentRoadmap.overall_progress : progressPercentage,
    updated_at: now
  };
}

export async function saveExplanationRecord(
  userId: string,
  entityType: string,
  entityId: string,
  modelVersion: string,
  explainerType: string,
  explanationData: any
) {
  const id = uuidv4();
  const now = new Date().toISOString();

  if (isPostgresConnected) {
    try {
      await pool.query(
        `INSERT INTO explanations (id, user_id, entity_type, entity_id, model_version, explainer_type, explanation_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, entity_type, entity_id)
         DO UPDATE SET model_version = EXCLUDED.model_version,
                       explainer_type = EXCLUDED.explainer_type,
                       explanation_data = EXCLUDED.explanation_data,
                       created_at = EXCLUDED.created_at`,
        [id, userId, entityType, entityId, modelVersion, explainerType, JSON.stringify(explanationData), now]
      );
      return { id, user_id: userId, entity_type: entityType, entity_id: entityId, model_version: modelVersion, explainer_type: explainerType, explanation_data: explanationData, created_at: now };
    } catch (e) {
      console.error("[Save Explanation Record Error]:", e);
    }
  }

  // Fallback
  const key = `${userId}_${entityType}_${entityId}`;
  const record = {
    id,
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    model_version: modelVersion,
    explainer_type: explainerType,
    explanation_data: explanationData,
    created_at: now
  };
  inMemoryStore.explanations.set(key, record);
  return record;
}

export async function getExplanationRecordByEntityId(
  userId: string,
  entityType: string,
  entityId: string
) {
  if (isPostgresConnected) {
    try {
      const res = await pool.query(
        `SELECT * FROM explanations WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
        [userId, entityType, entityId]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          ...row,
          explanation_data: typeof row.explanation_data === "string" ? JSON.parse(row.explanation_data) : row.explanation_data
        };
      }
    } catch (e) {
      console.error("[Get Explanation Record Error]:", e);
    }
  }

  // Fallback
  const key = `${userId}_${entityType}_${entityId}`;
  return inMemoryStore.explanations.get(key) || null;
}




