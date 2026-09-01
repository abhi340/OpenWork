"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { pb } from "@/lib/pocketbase";

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
}

interface AuthContextType {
  user: UserProfile;
  aiConfig: AIConfig;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<AuthResult>;
  signup: (email: string, pass: string, name: string) => Promise<AuthResult>;
  loginWithOAuth: (provider: "google" | "microsoft" | "github") => Promise<AuthResult>;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setWorkspaceName: (name: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateAIConfig: (updates: Partial<AIConfig>) => void;
  isAdmin: boolean;
}

const defaultUser: UserProfile = {
  name: "Abhiram Kodicherla",
  email: "abhiramkodicherla@gmail.com",
  role: "member",
  workspaceName: "Personal Execution Workspace",
  jobTitle: "Founder & Full-Stack Engineer",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  workHours: "9:00 AM – 6:00 PM",
  soundEnabled: true,
  defaultSprintMins: 25
};

const defaultAIConfig: AIConfig = {
  provider: "ollama",
  apiKey: "",
  baseUrl: "http://127.0.0.1:11434",
  model: "llama3",
  isEnabled: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [aiConfig, setAIConfig] = useState<AIConfig>(defaultAIConfig);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state from PocketBase authStore
  const syncFromAuthStore = useCallback(() => {
    const isValid = pb.authStore.isValid;
    setIsAuthenticated(isValid);

    if (isValid && pb.authStore.record) {
      const record = pb.authStore.record;
      setUser((prev) => ({
        ...prev,
        id: record.id,
        name: record.name || record.email?.split("@")[0] || prev.name,
        email: record.email || prev.email,
        role: (record.role as UserRole) || prev.role || "member",
        jobTitle: record.jobTitle || prev.jobTitle,
        workspaceName: record.workspaceName || prev.workspaceName
      }));

      // Cloud AI Config Sync: Restore user's cloud saved AI Key & Model
      const cloudAI = record.aiConfig || record.ai_config;
      if (cloudAI) {
        try {
          const parsed = typeof cloudAI === "string" ? JSON.parse(cloudAI) : cloudAI;
          if (parsed && typeof parsed === "object") {
            setAIConfig((prev) => {
              const merged = { ...prev, ...parsed };
              localStorage.setItem("openwork_ai_config", JSON.stringify(merged));
              return merged;
            });
          }
        } catch (e) {}
      }
    } else {
      // Revert to saved local user profile if available, or default
      const savedUser = localStorage.getItem("openwork_user_profile");
      if (savedUser) {
        try {
          setUser({ ...defaultUser, ...JSON.parse(savedUser) });
        } catch (e) {}
      } else {
        setUser(defaultUser);
      }
    }
  }, []);

  useEffect(() => {
    // 1. Initial authStore check and token refresh
    syncFromAuthStore();

    if (pb.authStore.isValid) {
      pb.collection("users")
        .authRefresh()
        .then(() => syncFromAuthStore())
        .catch(() => {
          pb.authStore.clear();
          syncFromAuthStore();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    // 2. Listen to PocketBase auth state changes across all tabs
    const unsubscribe = pb.authStore.onChange(() => {
      syncFromAuthStore();
    });

    // 3. Load saved AI settings from localStorage
    const savedAI = localStorage.getItem("openwork_ai_config");
    if (savedAI) {
      try {
        setAIConfig({ ...defaultAIConfig, ...JSON.parse(savedAI) });
      } catch (e) {}
    }

    return () => {
      unsubscribe();
    };
  }, [syncFromAuthStore]);

  const login = async (email: string, pass: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const authData = await pb.collection("users").authWithPassword(email.trim(), pass);
      syncFromAuthStore();
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const message = err?.response?.message || err?.message || "Invalid email or password.";
      return { success: false, error: message };
    }
  };

  const signup = async (email: string, pass: string, name: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      // Create user record in PocketBase
      await pb.collection("users").create({
        email: email.trim(),
        password: pass,
        passwordConfirm: pass,
        name: name.trim()
      });

      // Automatically authenticate upon creation
      await pb.collection("users").authWithPassword(email.trim(), pass);
      syncFromAuthStore();
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const message = err?.response?.message || err?.message || "Registration failed. Please check your details.";
      return { success: false, error: message };
    }
  };

  const loginWithOAuth = async (provider: "google" | "microsoft" | "github"): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const authData = await pb.collection("users").authWithOAuth2({ provider });
      
      // Auto-extract corporate domain name if corporate email
      if (authData.record?.email) {
        const domain = authData.record.email.split("@")[1];
        if (domain && !["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"].includes(domain.toLowerCase())) {
          const companyName = domain.split(".")[0];
          const capitalizedCompany = companyName.charAt(0).toUpperCase() + companyName.slice(1) + " Workspace";
          pb.collection("users").update(authData.record.id, {
            workspaceName: capitalizedCompany
          }).catch(() => {});
        }
      }

      syncFromAuthStore();
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const message = err?.response?.message || err?.message || `Could not authenticate with ${provider}. Ensure OAuth2 is enabled in PocketBase.`;
      return { success: false, error: message };
    }
  };

  const logout = () => {
    pb.authStore.clear();
    syncFromAuthStore();
    // Dispatch storage event to notify other tabs/stores
    window.dispatchEvent(new Event("openwork_auth_changed"));
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("openwork_user_profile", JSON.stringify(updated));

    // If authenticated in PocketBase, persist name/jobTitle to user record
    if (pb.authStore.isValid && pb.authStore.record?.id) {
      try {
        await pb.collection("users").update(pb.authStore.record.id, {
          name: updated.name,
          ...(updates.jobTitle ? { jobTitle: updates.jobTitle } : {})
        });
      } catch (e) {
        // Non-critical background sync
      }
    }
  };

  const updateAIConfig = (updates: Partial<AIConfig>) => {
    setAIConfig((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("openwork_ai_config", JSON.stringify(updated));

      // Push to PocketBase user account in the cloud
      if (pb.authStore.isValid && pb.authStore.record?.id) {
        pb.collection("users").update(pb.authStore.record.id, {
          aiConfig: updated
        }).catch(() => {
          // Fallback if custom field is not in schema
        });
      }

      return updated;
    });
  };

  const setRole = (role: UserRole) => {
    updateProfile({ role });
  };

  const setWorkspaceName = (workspaceName: string) => {
    updateProfile({ workspaceName });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      aiConfig,
      isAuthenticated,
      isGuest: !isAuthenticated,
      isLoading,
      login,
      signup,
      loginWithOAuth,
      logout,
      setRole, 
      setWorkspaceName, 
      updateProfile,
      updateAIConfig,
      isAdmin: user.role === "admin" || user.role === "manager" 
    }}>
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
