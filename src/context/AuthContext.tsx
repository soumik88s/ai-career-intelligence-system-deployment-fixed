import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserProfile, CandidateResume, ResumeRecord } from "../types";
import {
  loginUserApi,
  registerUserApi,
  getCurrentUserApi,
  updateUserProfileApi,
  getUserResumesApi,
} from "../services/api";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  resume: CandidateResume | null;
  userResumes: ResumeRecord[];
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  setResumeData: (resume: CandidateResume | null) => void;
  loadSampleDevResume: () => void;
  clearResume: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("auth_profile");
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("auth_token") || null;
  });

  const [userResumes, setUserResumes] = useState<ResumeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [resume, setResume] = useState<CandidateResume | null>(() => {
    const saved = localStorage.getItem("candidate_resume");
    return saved ? JSON.parse(saved) : null;
  });

  // Restore authenticated session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("auth_token");
      if (savedToken) {
        try {
          const meData = await getCurrentUserApi(savedToken);
          setUser(meData.user);
          setProfile(meData.profile);
          setToken(savedToken);
          
          const resumesData = await getUserResumesApi(savedToken).catch(() => ({ resumes: [] }));
          setUserResumes(resumesData.resumes || []);
        } catch (err) {
          console.warn("[Auth restoring session notice]: Token expired or invalid.", err);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_profile");
          setUser(null);
          setProfile(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth_user");
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      localStorage.setItem("auth_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("auth_profile");
    }
  }, [profile]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }, [token]);

  useEffect(() => {
    if (resume) {
      localStorage.setItem("candidate_resume", JSON.stringify(resume));
    } else {
      localStorage.removeItem("candidate_resume");
    }
  }, [resume]);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const res = await loginUserApi(email, password);
      setToken(res.access_token);
      setUser(res.user);

      // Fetch user profile and resumes
      const meData = await getCurrentUserApi(res.access_token);
      setProfile(meData.profile);

      const resumesData = await getUserResumesApi(res.access_token).catch(() => ({ resumes: [] }));
      setUserResumes(resumesData.resumes || []);
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setAuthError(null);
    try {
      const res = await registerUserApi(name, email, password);
      setToken(res.access_token);
      setUser(res.user);

      const meData = await getCurrentUserApi(res.access_token);
      setProfile(meData.profile);
      setUserResumes([]);
    } catch (err: any) {
      setAuthError(err.message || "Registration failed");
      throw err;
    }
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setProfile(null);
    setToken(null);
    setUserResumes([]);
    setResume(null);
    setAuthError(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_profile");
    localStorage.removeItem("candidate_resume");
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!token) throw new Error("Unauthenticated: Please log in");
    const res = await updateUserProfileApi(token, profileData);
    setProfile(res.profile);
  };

  const refreshUserData = async () => {
    if (!token) return;
    try {
      const meData = await getCurrentUserApi(token);
      setUser(meData.user);
      setProfile(meData.profile);

      const resumesData = await getUserResumesApi(token);
      setUserResumes(resumesData.resumes || []);
    } catch (e) {
      console.error("Failed to refresh user data:", e);
    }
  };

  const setResumeData = (newResume: CandidateResume | null) => {
    setResume(newResume);
  };

  const loadSampleDevResume = () => {
    const devResume: CandidateResume = {
      fileName: "sample_dev_resume_cse_grad.pdf",
      fileSize: "245 KB",
      uploadedAt: new Date().toISOString(),
      isDevelopmentData: true,
      extractedText: "Alex Rivera - Computer Science & Engineering Graduate. Proficient in Python, PyTorch, React, TypeScript, PostgreSQL, Machine Learning, Fast API, NLP, Docker, Data Structures, Algorithms. Projects: Smart Image Classifier, RAG Question Answering System. Experience: ML Intern at TechLab (6 months). B.S. Computer Science.",
      parsedSkills: ["Python", "PyTorch", "React", "TypeScript", "PostgreSQL", "Machine Learning", "FastAPI", "NLP", "Docker"],
      parsedEducation: ["B.S. Computer Science & Engineering"],
      parsedExperienceYears: 0.5
    };
    setResume(devResume);
  };

  const clearResume = () => {
    setResume(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        resume,
        userResumes,
        authError,
        login,
        register,
        logout,
        updateProfile,
        refreshUserData,
        setResumeData,
        loadSampleDevResume,
        clearResume
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
