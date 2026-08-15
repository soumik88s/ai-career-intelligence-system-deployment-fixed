import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Database,
  CheckCircle,
  AlertCircle,
  Cpu,
  ArrowRight,
  UserCheck,
  Zap,
  Sparkles,
  User,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Edit2,
  Save,
  Trash2,
  X,
  Plus
} from "lucide-react";
import { NavigationTab, SystemInfo } from "../types";
import { useAuth } from "../context/AuthContext";
import { fetchSystemInfo, fetchHealthStatus, deleteUserResumeApi } from "../services/api";
import { ThreeDCardWrapper } from "../components/ThreeDCardWrapper";

interface DashboardPageProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { user, profile, isAuthenticated, token, userResumes, updateProfile, refreshUserData, loadSampleDevResume, resume } = useAuth();
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [health, setHealth] = useState<any>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [educationInput, setEducationInput] = useState("");
  const [expInput, setExpInput] = useState<number | string>(0);
  const [targetRoleInput, setTargetRoleInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemInfo().then(setSysInfo);
    fetchHealthStatus().then(setHealth);
  }, []);

  useEffect(() => {
    if (profile) {
      setPhoneInput(profile.phone || "");
      setLocationInput(profile.location || "");
      setEducationInput(profile.education || "");
      setExpInput(profile.experience_years || 0);
      setTargetRoleInput(profile.target_role || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateProfile({
        phone: phoneInput,
        location: locationInput,
        education: educationInput,
        experience_years: Number(expInput) || 0,
        target_role: targetRoleInput
      });
      setIsEditingProfile(false);
      setProfileMsg("Profile updated successfully!");
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg(err.message || "Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!token) return;
    try {
      await deleteUserResumeApi(token, resumeId);
      await refreshUserData();
    } catch (err) {
      console.error("Failed to delete resume:", err);
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Candidate Dashboard & System Monitor
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Authenticated user state, PostgreSQL database profile records, and system health status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" />
            PostgreSQL Schema Active
          </span>
        </div>
      </div>

      {/* Top Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Auth Status Card */}
        <ThreeDCardWrapper depth={12}>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 h-full shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Auth Session</span>
              <UserCheck className={`w-4 h-4 ${isAuthenticated ? "text-emerald-500" : "text-amber-500"}`} />
            </div>
            <p className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
              {isAuthenticated ? user?.name : "Logged Out"}
            </p>
            <span className="text-[11px] block text-stone-500 dark:text-stone-400 truncate">
              {isAuthenticated ? user?.email : "Authentication required"}
            </span>
          </div>
        </ThreeDCardWrapper>

        {/* Resume Status Card */}
        <ThreeDCardWrapper depth={12}>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 h-full shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Stored Resumes</span>
              <FileText className={`w-4 h-4 ${(userResumes.length > 0 || resume) ? "text-blue-500" : "text-stone-400"}`} />
            </div>
            <p className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
              {userResumes.length > 0 ? `${userResumes.length} Resume(s) Recorded` : resume ? resume.fileName : "No resume uploaded yet."}
            </p>
            <span className="text-[11px] block text-stone-500 dark:text-stone-400">
              {userResumes.length > 0 ? "Database record synchronized" : resume ? "Local session loaded" : "Awaiting PDF or DOCX file"}
            </span>
          </div>
        </ThreeDCardWrapper>

        {/* Active Phase */}
        <ThreeDCardWrapper depth={12}>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 h-full shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Architecture Phase</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-base font-bold text-stone-900 dark:text-stone-100">Phase 2</p>
            <span className="text-[11px] block text-stone-500 dark:text-stone-400">
              PostgreSQL DB & JWT Auth
            </span>
          </div>
        </ThreeDCardWrapper>

        {/* System Microservice */}
        <ThreeDCardWrapper depth={12}>
          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 h-full shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">PostgreSQL Status</span>
              <Cpu className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-base font-bold text-stone-900 dark:text-stone-100">
              {health?.services?.database?.postgresConnected ? "Connected" : "Active Schema"}
            </p>
            <span className="text-[11px] block text-stone-500 dark:text-stone-400 truncate">
              {health?.services?.database?.postgresConnected ? "PostgreSQL Port 5432" : "Database Ready"}
            </span>
          </div>
        </ThreeDCardWrapper>
      </div>

      {/* User Profile Record & Editor */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                User Profile Record (user_profiles table)
              </h3>
              <p className="text-[11px] text-stone-500">
                Linked 1:1 with user account ID ({user?.id || "Unauthenticated"})
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              {isEditingProfile ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
              {isEditingProfile ? "Cancel" : "Edit Profile"}
            </button>
          )}
        </div>

        {profileMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>{profileMsg}</span>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="p-6 text-center space-y-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              You are currently using an unauthenticated isolated view. Log in or create an account to persist user profiles in PostgreSQL.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setActiveTab("login")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => setActiveTab("register")}
                className="px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-800 dark:text-stone-200 font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Register
              </button>
            </div>
          </div>
        ) : isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="San Francisco, CA"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Education Degree</label>
                <input
                  type="text"
                  placeholder="B.S. Computer Science & Engineering"
                  value={educationInput}
                  onChange={(e) => setEducationInput(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={expInput}
                  onChange={(e) => setExpInput(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Target Career Role</label>
                <input
                  type="text"
                  placeholder="AI / Machine Learning Engineer"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProfile ? "Saving..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg space-y-1">
              <span className="text-stone-400 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</span>
              <p className="font-medium text-stone-900 dark:text-stone-100">{profile?.phone || "Not provided"}</p>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg space-y-1">
              <span className="text-stone-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location</span>
              <p className="font-medium text-stone-900 dark:text-stone-100">{profile?.location || "Not provided"}</p>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg space-y-1">
              <span className="text-stone-400 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Education</span>
              <p className="font-medium text-stone-900 dark:text-stone-100">{profile?.education || "Not provided"}</p>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg space-y-1">
              <span className="text-stone-400 flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Experience</span>
              <p className="font-medium text-stone-900 dark:text-stone-100">{profile?.experience_years ? `${profile.experience_years} years` : "0 years"}</p>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg space-y-1 sm:col-span-2">
              <span className="text-stone-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Target Role</span>
              <p className="font-medium text-stone-900 dark:text-stone-100">{profile?.target_role || "Not specified"}</p>
            </div>
          </div>
        )}
      </div>

      {/* User Resumes Section (resumes table) */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Uploaded Resumes (resumes table)
          </h3>

          <button
            onClick={() => setActiveTab("upload")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Upload Resume
          </button>
        </div>

        {userResumes.length === 0 && !resume ? (
          <div className="p-8 text-center space-y-2 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-300 dark:border-stone-700">
            <FileText className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              No resume uploaded yet.
            </p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Upload your PDF, DOCX, or TXT resume to prepare for NLP parsing in Phase 3.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userResumes.map((resRecord) => (
              <div
                key={resRecord.id}
                className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    PDF
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {resRecord.original_filename}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Uploaded on {new Date(resRecord.uploaded_at).toLocaleDateString()} • {(resRecord.file_size_bytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteResume(resRecord.id)}
                  title="Delete Resume"
                  className="p-2 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {resume && userResumes.length === 0 && (
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    DEV
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {resume.fileName}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Session Resume • {resume.fileSize} • Loaded at {new Date(resume.uploadedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Action Workflows */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Quick Workflows
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab("upload")}
            className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="block text-xs font-semibold text-stone-900 dark:text-stone-100">Upload Resume</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">Process PDF or DOCX file</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            onClick={loadSampleDevResume}
            className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-amber-500" />
              <div>
                <span className="block text-xs font-semibold text-stone-900 dark:text-stone-100">Load Dev Resume</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">Test with sample candidate data</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="block text-xs font-semibold text-stone-900 dark:text-stone-100">View Architecture</span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400">Specs & Viva Voce Guide</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </div>

      {/* Incremental Phase Roadmap */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Incremental Phase Roadmap
        </h3>
        <div className="space-y-3">
          {sysInfo?.architectureModules.map((mod, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                mod.implemented
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
                  : "bg-stone-50 dark:bg-stone-800/30 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {mod.implemented ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-stone-400 shrink-0" />
                )}
                <span className="font-medium">{mod.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                mod.implemented
                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                  : "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
              }`}>
                {mod.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
