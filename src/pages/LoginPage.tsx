import React, { useState } from "react";
import { LogIn, Mail, Lock, Loader2, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NavigationTab } from "../types";

interface LoginPageProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setActiveTab }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email format.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        setActiveTab("dashboard");
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 text-center space-y-1">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/60 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-2">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Sign In to Your Account
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Enter your credentials to access your user profile and candidate dashboard.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Login successful! Redirecting to dashboard...</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-400 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-600 dark:text-stone-400 flex items-center justify-center gap-1">
          <span>Don't have an account yet?</span>
          <button
            onClick={() => setActiveTab("register")}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
          >
            <UserPlus className="w-3 h-3" /> Register
          </button>
        </div>
      </div>
    </div>
  );
};
