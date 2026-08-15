import React, { useState } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Background3DCanvas } from "./components/Background3DCanvas";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { NavigationTab } from "./types";
import { motion, AnimatePresence } from "motion/react";

// Page Views
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UploadPage } from "./pages/UploadPage";
import { ResumeAnalysisPage } from "./pages/ResumeAnalysisPage";
import { JobMatchingPage } from "./pages/JobMatchingPage";
import { JobRecommendationsPage } from "./pages/JobRecommendationsPage";
import { CareerPredictionPage } from "./pages/CareerPredictionPage";
import { SkillGapPage } from "./pages/SkillGapPage";
import { CareerRoadmapPage } from "./pages/CareerRoadmapPage";
import { RagAssistantPage } from "./pages/RagAssistantPage";
import { ArchitecturePage } from "./pages/ArchitecturePage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("landing");

  const renderActiveView = () => {
    switch (activeTab) {
      case "landing":
        return <LandingPage setActiveTab={setActiveTab} />;
      case "login":
        return <LoginPage setActiveTab={setActiveTab} />;
      case "register":
        return <RegisterPage setActiveTab={setActiveTab} />;
      case "dashboard":
        return <DashboardPage setActiveTab={setActiveTab} />;
      case "upload":
        return <UploadPage setActiveTab={setActiveTab} />;
      case "analysis":
        return <ResumeAnalysisPage setActiveTab={setActiveTab} />;
      case "matching":
        return <JobMatchingPage setActiveTab={setActiveTab} />;
      case "jobs":
        return <JobRecommendationsPage setActiveTab={setActiveTab} />;
      case "career_prediction":
        return <CareerPredictionPage onNavigateTab={setActiveTab} />;
      case "skillgap":
        return <SkillGapPage setActiveTab={setActiveTab} />;
      case "roadmap":
        return <CareerRoadmapPage setActiveTab={setActiveTab} />;
      case "assistant":
        return <RagAssistantPage />;
      case "architecture":
        return <ArchitecturePage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <LandingPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="relative min-h-screen flex flex-col bg-stone-100/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <Background3DCanvas />
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.99 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
