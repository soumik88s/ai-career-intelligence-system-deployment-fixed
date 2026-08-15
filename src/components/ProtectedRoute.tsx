import React from "react";
import { useAuth } from "../context/AuthContext";
import { NavigationTab } from "../types";
import { Lock, LogIn, UserPlus, ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  setActiveTab: (tab: NavigationTab) => void;
  requiredFeatureName?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  setActiveTab,
  requiredFeatureName = "this page",
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-stone-500">Verifying security token and database state...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Authentication Required
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            You must be logged in to access {requiredFeatureName} and personalized candidate resumes.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => setActiveTab("login")}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
