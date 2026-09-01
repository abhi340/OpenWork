"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { requestPasswordReset } from "@/lib/pocketbase";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  Globe,
  Eye,
  EyeOff,
  X,
  KeyRound
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleProceed = () => {
    router.push("/");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetting(true);
    setResetStatus(null);

    const res = await requestPasswordReset(resetEmail);
    setIsResetting(false);

    if (res.success) {
      setResetStatus({
        success: true,
        message: `Password reset link sent to ${resetEmail}. Check your inbox (or PocketBase console if testing locally).`
      });
    } else {
      setResetStatus({
        success: false,
        message: res.error || "Failed to send password reset email."
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setErrorMessage("Please provide your full name.");
        return;
      }
      if (password.length < 8) {
        setErrorMessage("Password must be at least 8 characters long.");
        return;
      }
      if (password !== passwordConfirm) {
        setErrorMessage("Passwords do not match.");
        return;
      }

      setIsLoading(true);
      const res = await signup(email, password, name);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => router.push("/"), 800);
      } else {
        setErrorMessage(res.error || "Failed to create account.");
      }
    } else {
      setIsLoading(true);
      const res = await login(email, password);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage("Signed in successfully! Redirecting...");
        setTimeout(() => router.push("/"), 800);
      } else {
        setErrorMessage(res.error || "Invalid credentials. Please verify your email and password.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors relative">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-md mb-2">
            OW
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-50 flex items-center justify-center gap-2">
            <span>OpenWork</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              PRO
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
            High-speed modular execution cockpit. Sign in to synchronize your board across devices.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Abhiram Kodicherla"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-2xs"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Mail size={13} className="text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-2xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-400" />
                  <span>Password</span>
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsResetOpen(true);
                    }}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
                  className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-2xs font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-400" />
                  <span>Confirm Password</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-2xs font-mono"
                  required
                />
              </div>
            )}

            {mode === "signin" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800"
                />
                <label htmlFor="rememberMe" className="text-xs text-slate-600 dark:text-zinc-400 cursor-pointer">
                  Remember me on this device
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all mt-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : mode === "signin" ? (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight size={13} />
                </>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
            <span className="absolute px-2 bg-white dark:bg-zinc-900 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              or
            </span>
          </div>

          {/* 1-Click Demo / Guest Option */}
          <button
            type="button"
            onClick={handleProceed}
            className="w-full py-2.5 px-4 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Zap size={13} className="text-amber-500" />
            <span>Continue in Local Offline Mode</span>
          </button>
        </div>

        {/* Security & Cloud Assurance */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-zinc-500">
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>Encrypted Session</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Globe size={12} className="text-blue-500" />
            <span>PocketBase Engine</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Reset Password</h3>
              </div>
              <button
                onClick={() => {
                  setIsResetOpen(false);
                  setResetStatus(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Enter your registered email address and we will send you a password reset link.
            </p>

            {resetStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  resetStatus.success
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
              >
                {resetStatus.success ? <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
                <span className="leading-relaxed">{resetStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Email Address</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetOpen(false);
                    setResetStatus(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-xs"
                >
                  {isResetting ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
