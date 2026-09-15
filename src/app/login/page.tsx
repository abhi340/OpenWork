"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { type ConfirmationResult, isFirebaseConfigured } from "@/lib/firebase";
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
  Phone,
  KeyRound,
  RotateCcw
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, loginWithGoogle, sendPhoneOtp, verifyPhoneOtp } = useAuth();

  // Auth Methods: "email" | "phone"
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  
  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Phone Auth state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Google OAuth Popup Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await loginWithGoogle();
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage("Google authentication successful! Launching workspace...");
      setTimeout(() => router.replace("/"), 400);
    } else {
      setErrorMessage(res.error || "Google Sign-In failed.");
    }
  };

  // 2. Email Sign In / Sign Up
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setErrorMessage("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
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
        setSuccessMessage("Firebase account created successfully! Launching workspace...");
        setTimeout(() => router.replace("/"), 400);
      } else {
        setErrorMessage(res.error || "Failed to create account.");
      }
    } else {
      setIsLoading(true);
      const res = await login(email, password);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage("Signed in successfully! Launching workspace...");
        setTimeout(() => router.replace("/"), 400);
      } else {
        setErrorMessage(res.error || "Invalid credentials. Please verify your email and password.");
      }
    }
  };

  // 3. Phone SMS Auth - Send OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!phoneNumber.trim()) {
      setErrorMessage("Please enter your mobile phone number with country code (e.g. +919876543210 or +15551234567).");
      return;
    }

    setIsLoading(true);
    const res = await sendPhoneOtp(phoneNumber, "recaptcha-container");
    setIsLoading(false);

    if (res.success && res.confirmationResult) {
      setConfirmationResult(res.confirmationResult);
      setIsOtpSent(true);
      setSuccessMessage(`SMS verification code sent to ${phoneNumber}.`);
    } else {
      setErrorMessage(res.error || "Failed to send SMS OTP.");
    }
  };

  // 4. Phone SMS Auth - Verify OTP
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!confirmationResult) {
      setErrorMessage("Verification session expired. Please request a new code.");
      setIsOtpSent(false);
      return;
    }

    if (!verificationCode.trim()) {
      setErrorMessage("Please enter the 6-digit verification code sent via SMS.");
      return;
    }

    setIsLoading(true);
    const res = await verifyPhoneOtp(confirmationResult, verificationCode);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage("Phone verification verified! Launching workspace...");
      setTimeout(() => router.replace("/"), 400);
    } else {
      setErrorMessage(res.error || "Verification code is incorrect.");
    }
  };

  const handleProceedOffline = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors relative">
      {/* Invisible ReCAPTCHA Container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-md mb-2">
            OW
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-50 flex items-center justify-center gap-2">
            <span>OpenWork</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              FIREBASE
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
            High-speed modular execution cockpit powered by Firebase Auth & Cloud Firestore.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {/* Method Selector: Email vs Phone */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-zinc-800/80 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMethod === "email"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              <Mail size={13} />
              <span>Email & Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMethod === "phone"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              <Phone size={13} />
              <span>Phone SMS</span>
            </button>
          </div>

          {/* Firebase API Key Setup Alert */}
          {!isFirebaseConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
                <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>Firebase API Key Required</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                Please add your Firebase Web API key to <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">.env.local</code> to activate live authentication for project <strong>openwork-2be9f</strong>.
              </p>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* 1-Click Google SSO Button */}
          <div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2.5 text-slate-700 dark:text-zinc-200 transition-all shadow-2xs group disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
            <span className="absolute px-2 bg-white dark:bg-zinc-900 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {authMethod === "email" ? "or email credentials" : "or phone number"}
            </span>
          </div>

          {/* Tab Form 1: Email Authentication */}
          {authMethod === "email" && (
            <div className="space-y-4">
              {/* Sign In vs Sign Up Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage(null);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
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
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mode === "signup"
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      <span>Email Address</span>
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock size={13} className="text-slate-400" />
                      <span>Password</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all mt-2"
                >
                  {isLoading ? (
                    <span>Authenticating with Firebase...</span>
                  ) : mode === "signin" ? (
                    <>
                      <span>Sign In with Email</span>
                      <ArrowRight size={13} />
                    </>
                  ) : (
                    <>
                      <span>Create Firebase Account</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Tab Form 2: Phone SMS Authentication */}
          {authMethod === "phone" && (
            <div className="space-y-4">
              {!isOtpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        <span>Phone Number (International format)</span>
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+15551234567 or +919876543210"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-2xs font-mono"
                      required
                    />
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Include country code starting with '+' (e.g. +1 for US, +91 for India).
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !phoneNumber.trim()}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isLoading ? (
                      <span>Sending SMS Code...</span>
                    ) : (
                      <>
                        <span>Send SMS Verification Code</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <KeyRound size={13} className="text-slate-400" />
                        <span>6-Digit Verification Code</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtpSent(false);
                          setVerificationCode("");
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={11} />
                        <span>Change Number</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 text-center text-sm tracking-widest font-mono font-bold rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-2xs"
                      required
                    />
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center">
                      Enter the 6-digit code received on {phoneNumber}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length < 4}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isLoading ? (
                      <span>Verifying Code...</span>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <CheckCircle2 size={13} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
            <span className="absolute px-2 bg-white dark:bg-zinc-900 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              or
            </span>
          </div>

          {/* 1-Click Demo / Local Offline Mode */}
          <button
            type="button"
            onClick={handleProceedOffline}
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
            <span>Firebase Auth SSL</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Globe size={12} className="text-amber-500" />
            <span>Cloud Firestore Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}
