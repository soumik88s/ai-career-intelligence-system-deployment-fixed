import React, { useState } from "react";
import { X, LogIn, UserPlus, Mail, Lock, User as UserIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Frontend validation
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address (e.g., student@university.edu).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (mode === "register" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(email.trim(), password);
        setSuccessMsg("Logged in successfully!");
      } else {
        await register(name.trim(), email.trim(), password);
        setSuccessMsg("Account created and user profile initialized!");
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Authentication error. Please check your credentials.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            {mode === "login" ? (
              <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {mode === "login" ? "User Login" : "Candidate Registration"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="e.g., Alex Rivera / Prof. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Email Address <span className="text-rose-500">*</span>
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
              Password <span className="text-rose-500">*</span> (min 6 characters)
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
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-400 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-600 dark:text-stone-400">
          {mode === "login" ? (
            <span>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
              >
                Register
              </button>
            </span>
          ) : (
            <span>
              Already registered?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
              >
                Log In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
