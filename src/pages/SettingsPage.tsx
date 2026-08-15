import React, { useEffect, useState } from "react";
import { Settings, User, Key, Moon, Sun, Database, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchHealthStatus } from "../services/api";

export const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, logout, resume, clearResume } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetchHealthStatus().then(setHealth);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Settings & Environment Diagnostics
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
          Manage user session, theme preferences, and backend API key configuration status.
        </p>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          User Profile & Authentication State
        </h3>

        {isAuthenticated ? (
          <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-lg space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-500">Name:</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Email:</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Role:</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">{user?.role}</span>
            </div>

            <div className="pt-2">
              <button
                onClick={logout}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-md cursor-pointer transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-stone-500 italic">No user logged in. Using isolated state.</p>
        )}
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          {theme === "light" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-400" />}
          Theme Preference
        </h3>

        <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800/60 rounded-lg">
          <div>
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
              Active Theme: {theme.toUpperCase()}
            </span>
            <span className="text-[11px] text-stone-500">
              Toggle between Light and Dark interface appearance.
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Switch to {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </div>

      {/* API Key & System Diagnostics */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-purple-500" />
          Environment Credentials Status
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-lg flex items-center justify-between">
            <span>Gemini API Key Configured</span>
            {health?.services?.geminiApiKeyConfigured ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Template (.env.example)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reset State Action */}
      {resume && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Candidate Resume State Reset
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Clears the currently loaded candidate resume ({resume.fileName}) from browser local storage.
          </p>
          <button
            onClick={clearResume}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Clear Loaded Resume Data
          </button>
        </div>
      )}
    </div>
  );
};
