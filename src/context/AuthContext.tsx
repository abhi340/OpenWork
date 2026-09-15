"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPhoneNumber,
  setupRecaptcha,
  type ConfirmationResult
} from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser, updateProfile as updateFirebaseProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export type UserRole = "admin" | "manager" | "member" | "guest";

export interface AIConfig {
  provider: "ollama" | "openai" | "groq" | "openrouter" | "gemini" | "nvidia" | "custom";
  apiKey: string;
  baseUrl: string;
  model: string;
  isEnabled: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  workspaceName: string;
  jobTitle?: string;
  avatarUrl?: string;
  workHours?: string;
  soundEnabled?: boolean;
  defaultSprintMins?: number;
}

interface AuthResult {
  success: boolean;
  error?: string;
  confirmationResult?: ConfirmationResult;
}

interface AuthContextType {
  user: UserProfile;
  firebaseUser: FirebaseUser | null;
  aiConfig: AIConfig;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<AuthResult>;
  signup: (email: string, pass: string, name: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  sendPhoneOtp: (phoneNumber: string, containerId?: string) => Promise<AuthResult>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, verificationCode: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => void;
  setWorkspaceName: (name: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateAIConfig: (updates: Partial<AIConfig>) => void;
  isAdmin: boolean;
}

const defaultUser: UserProfile = {
  id: "user_owner_001",
  name: "Abhiram Kodicherla",
  email: "abhicm019@gmail.com",
  phoneNumber: "",
  role: "admin",
  workspaceName: "Execution Workspace",
  jobTitle: "Founder & Full-Stack Engineer",
  avatarUrl: "",
  workHours: "9:00 AM – 6:00 PM",
  soundEnabled: true,
  defaultSprintMins: 25
};

const defaultAIConfig: AIConfig = {
  provider: "nvidia",
  apiKey: "",
  baseUrl: "https://integrate.api.nvidia.com/v1",
  model: "meta/llama-3.3-70b-instruct",
  isEnabled: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [aiConfig, setAIConfig] = useState<AIConfig>(defaultAIConfig);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync / Load User Profile from Firestore
  const syncUserProfile = useCallback(async (fbUser: FirebaseUser, fallbackName?: string) => {
    try {
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      const email = fbUser.email || (fbUser.phoneNumber ? `${fbUser.phoneNumber}@phone.openwork.app` : "user@openwork.app");
      const name = fbUser.displayName || fallbackName || (email.includes("@") ? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "OpenWork User");
      const role: UserRole = (email.includes("admin") || email === "abhicm019@gmail.com") ? "admin" : "member";

      if (userSnap.exists()) {
        const data = userSnap.data();
        const profile: UserProfile = {
          id: fbUser.uid,
          name: data.name || name,
          email: data.email || email,
          phoneNumber: data.phoneNumber || fbUser.phoneNumber || "",
          role: data.role || role,
          workspaceName: data.workspaceName || `${name}'s Workspace`,
          jobTitle: data.jobTitle || "Product Team",
          avatarUrl: data.avatarUrl || fbUser.photoURL || "",
          workHours: data.workHours || "9:00 AM – 6:00 PM",
          soundEnabled: data.soundEnabled ?? true,
          defaultSprintMins: data.defaultSprintMins || 25
        };
        setUser(profile);
        localStorage.setItem("openwork_user_profile", JSON.stringify(profile));
      } else {
        // Create initial Firestore Profile Document
        const newProfile: UserProfile = {
          id: fbUser.uid,
          name: name,
          email: email,
          phoneNumber: fbUser.phoneNumber || "",
          role: role,
          workspaceName: `${name}'s Workspace`,
          jobTitle: "Product Team",
          avatarUrl: fbUser.photoURL || "",
          workHours: "9:00 AM – 6:00 PM",
          soundEnabled: true,
          defaultSprintMins: 25
        };

        await setDoc(userRef, {
          uid: fbUser.uid,
          name: newProfile.name,
          email: newProfile.email,
          phoneNumber: newProfile.phoneNumber,
          role: newProfile.role,
          workspaceName: newProfile.workspaceName,
          jobTitle: newProfile.jobTitle,
          avatarUrl: newProfile.avatarUrl,
          workHours: newProfile.workHours,
          soundEnabled: newProfile.soundEnabled,
          defaultSprintMins: newProfile.defaultSprintMins,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        setUser(newProfile);
        localStorage.setItem("openwork_user_profile", JSON.stringify(newProfile));
      }
    } catch (err) {
      console.warn("Firestore profile sync fallback (local only):", err);
      const email = fbUser.email || (fbUser.phoneNumber ? `${fbUser.phoneNumber}@phone.openwork.app` : "user@openwork.app");
      const name = fbUser.displayName || fallbackName || email.split("@")[0];
      const localProfile: UserProfile = {
        id: fbUser.uid,
        name: name,
        email: email,
        phoneNumber: fbUser.phoneNumber || "",
        role: email === "abhicm019@gmail.com" ? "admin" : "member",
        workspaceName: `${name}'s Workspace`,
        jobTitle: "Product Team",
        avatarUrl: fbUser.photoURL || "",
        workHours: "9:00 AM – 6:00 PM",
        soundEnabled: true,
        defaultSprintMins: 25
      };
      setUser(localProfile);
      localStorage.setItem("openwork_user_profile", JSON.stringify(localProfile));
    }
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    // Restore AI Config from local storage
    try {
      const savedAI = localStorage.getItem("openwork_ai_config");
      if (savedAI) {
        setAIConfig((prev) => ({ ...prev, ...JSON.parse(savedAI) }));
      }
    } catch (e) {}

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        setIsAuthenticated(true);
        localStorage.setItem("openwork_auth_session", "true");
        await syncUserProfile(fbUser);
      } else {
        setFirebaseUser(null);
        // Check if there was an offline/local session stored
        const savedAuth = localStorage.getItem("openwork_auth_session");
        const savedProfile = localStorage.getItem("openwork_user_profile");
        if (savedAuth === "true" && savedProfile) {
          try {
            setUser(JSON.parse(savedProfile));
            setIsAuthenticated(true);
          } catch (e) {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  // 1. Email/Password Login
  const login = async (email: string, pass: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !pass) {
        setIsLoading(false);
        return { success: false, error: "Please enter your email and password." };
      }

      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      await syncUserProfile(userCredential.user);
      setIsAuthenticated(true);
      localStorage.setItem("openwork_auth_session", "true");
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      let errorMsg = err.message || "Failed to authenticate with Firebase.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errorMsg = "Invalid email or password. Please try again or create an account.";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "Too many failed attempts. Please wait a few minutes before retrying.";
      } else if (err.code === "auth/invalid-api-key" || err.code === "auth/api-key-not-valid.pleas") {
        errorMsg = "Firebase API key is not configured. Please check your project settings.";
      }
      return { success: false, error: errorMsg };
    }
  };

  // 2. Email/Password Signup
  const signup = async (email: string, pass: string, name: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      if (!cleanEmail || !pass || !cleanName) {
        setIsLoading(false);
        return { success: false, error: "Please fill in all registration fields." };
      }

      if (pass.length < 6) {
        setIsLoading(false);
        return { success: false, error: "Password must be at least 6 characters long." };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      
      // Update Firebase Auth display name
      if (auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, { displayName: cleanName });
      }

      await syncUserProfile(userCredential.user, cleanName);
      setIsAuthenticated(true);
      localStorage.setItem("openwork_auth_session", "true");
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      let errorMsg = err.message || "Failed to create account.";
      if (err.code === "auth/email-already-in-use") {
        errorMsg = "An account with this email already exists. Please sign in.";
      } else if (err.code === "auth/weak-password") {
        errorMsg = "Password is too weak. Please use at least 6 characters.";
      }
      return { success: false, error: errorMsg };
    }
  };

  // 3. Google Sign-In (OAuth Popup)
  const loginWithGoogle = async (): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
      setIsAuthenticated(true);
      localStorage.setItem("openwork_auth_session", "true");
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      let errorMsg = err.message || "Google Sign-In failed.";
      if (err.code === "auth/popup-closed-by-user") {
        errorMsg = "Google Sign-In popup was closed before completing.";
      } else if (err.code === "auth/popup-blocked") {
        errorMsg = "Popup was blocked by your browser. Please allow popups for localhost.";
      } else if (err.code === "auth/unauthorized-domain") {
        errorMsg = "Unauthorized domain. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains.";
      } else if (err.code === "auth/operation-not-allowed" || err.code === "auth/admin-restricted-operation") {
        errorMsg = "Google Sign-In is not enabled yet in your Firebase Console. Go to Firebase Console > Authentication > Sign-in method and enable Google.";
      }
      return { success: false, error: errorMsg };
    }
  };

  // 4. Phone Auth - Send SMS OTP
  const sendPhoneOtp = async (phoneNumber: string, containerId = "recaptcha-container"): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const cleanPhone = phoneNumber.trim();

      if (!cleanPhone || cleanPhone.length < 8) {
        setIsLoading(false);
        return { success: false, error: "Please enter a valid phone number with country code (e.g., +15551234567 or +919876543210)." };
      }

      const verifier = setupRecaptcha(containerId);
      const confirmationResult = await signInWithPhoneNumber(auth, cleanPhone, verifier);
      setIsLoading(false);
      return { success: true, confirmationResult };
    } catch (err: any) {
      setIsLoading(false);
      let errorMsg = err.message || "Failed to send SMS verification code.";
      if (err.code === "auth/invalid-phone-number") {
        errorMsg = "The phone number format is invalid. Please use international format: +[CountryCode][Number] (e.g., +919876543210).";
      } else if (err.code === "auth/quota-exceeded") {
        errorMsg = "SMS quota exceeded for this project. Please try again later or use Google / Email sign-in.";
      } else if (err.code === "auth/captcha-check-failed") {
        errorMsg = "ReCAPTCHA verification failed. Please refresh and try again.";
      }
      return { success: false, error: errorMsg };
    }
  };

  // 5. Phone Auth - Verify SMS OTP
  const verifyPhoneOtp = async (confirmationResult: ConfirmationResult, verificationCode: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const cleanCode = verificationCode.trim();

      if (!cleanCode || cleanCode.length < 4) {
        setIsLoading(false);
        return { success: false, error: "Please enter the 6-digit SMS verification code." };
      }

      const result = await confirmationResult.confirm(cleanCode);
      await syncUserProfile(result.user);
      setIsAuthenticated(true);
      localStorage.setItem("openwork_auth_session", "true");
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      let errorMsg = err.message || "Verification failed.";
      if (err.code === "auth/invalid-verification-code") {
        errorMsg = "Invalid verification code. Please check the SMS and try again.";
      } else if (err.code === "auth/code-expired") {
        errorMsg = "Verification code has expired. Please request a new code.";
      }
      return { success: false, error: errorMsg };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn("Firebase signout error:", e);
    }
    localStorage.removeItem("openwork_auth_session");
    localStorage.removeItem("openwork_user_profile");
    setIsAuthenticated(false);
    setFirebaseUser(null);
    setUser(defaultUser);
  };

  const setRole = (role: UserRole) => {
    updateProfile({ role });
  };

  const setWorkspaceName = (name: string) => {
    updateProfile({ workspaceName: name });
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("openwork_user_profile", JSON.stringify(updated));

    if (firebaseUser?.uid) {
      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Failed to update Firestore profile document:", err);
      }
    }
  };

  const updateAIConfig = (updates: Partial<AIConfig>) => {
    setAIConfig((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("openwork_ai_config", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        aiConfig,
        isAuthenticated,
        isGuest: !isAuthenticated,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        sendPhoneOtp,
        verifyPhoneOtp,
        logout,
        setRole,
        setWorkspaceName,
        updateProfile,
        updateAIConfig,
        isAdmin: user.role === "admin"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
