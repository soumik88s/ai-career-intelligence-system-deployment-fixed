import React, { useState } from "react";
import {
  Brain,
  BrainCircuit,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Upload,
  FileText,
  Target,
  Briefcase,
  GitCompare,
  Milestone,
  Bot,
  Layers,
  Settings,
  Sparkles,
  BookOpen,
  Sparkle
} from "lucide-react";
import { NavigationTab } from "../types";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { AuthModal } from "./AuthModal";

interface NavbarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openLogin = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthMode("register");
    setIsAuthModalOpen(true);
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: "landing", label: "Overview", icon: <BookOpen className="w-4 h-4" /> },
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "upload", label: "Upload Resume", icon: <Upload className="w-4 h-4" /> },
    { id: "analysis", label: "Resume Analysis", icon: <FileText className="w-4 h-4" /> },
    { id: "matching", label: "Job Matching", icon: <Target className="w-4 h-4" /> },
    { id: "jobs", label: "Jobs & Recs", icon: <Briefcase className="w-4 h-4" /> },
    { id: "career_prediction", label: "ML Career Predictor", icon: <BrainCircuit className="w-4 h-4" /> },
    { id: "skillgap", label: "Skill Gap", icon: <GitCompare className="w-4 h-4" /> },
    { id: "roadmap", label: "Career Roadmap", icon: <Milestone className="w-4 h-4" /> },
    { id: "assistant", label: "RAG Assistant", icon: <Bot className="w-4 h-4" /> },
    { id: "architecture", label: "Architecture", icon: <Layers className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        {/* Top Branding Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div
              onClick={() => setActiveTab("landing")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-none">
                    AI Career Intelligence
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    
                    
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  NLP, Deep Learning & RAG Research System
                </p>
              </div>
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-3">
              {/* Theme Switcher */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              >
                {theme === "light" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>

              {/* User Account / Auth Actions */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3 pl-2 border-l border-stone-200 dark:border-stone-800">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">
                      {user?.email}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    title="Log Out"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800">
                  <button
                    onClick={openLogin}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Log In
                  </button>
                  <button
                    onClick={openRegister}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Nav Tabs */}
        <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 py-1.5" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};
