"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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
  id: "user_owner_001",
  name: "Abhiram Kodicherla",
  email: "abhicm019@gmail.com",
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
  const [aiConfig, setAIConfig] = useState<AIConfig>(defaultAIConfig);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("openwork_auth_session");
      const savedProfile = localStorage.getItem("openwork_user_profile");
      const savedAI = localStorage.getItem("openwork_ai_config");

      if (savedAuth === "true" || savedAuth) {
        setIsAuthenticated(true);
        if (savedProfile) {
          try {
            setUser((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
          } catch (e) {}
        }
      } else {
        setIsAuthenticated(false);
      }

      if (savedAI) {
        try {
          setAIConfig((prev) => ({ ...prev, ...JSON.parse(savedAI) }));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to restore session:", err);
    } finally {
      setIsLoading(false);
    }

    const handleAuthChange = () => {
      const isAuth = localStorage.getItem("openwork_auth_session") === "true";
      setIsAuthenticated(isAuth);
      const profile = localStorage.getItem("openwork_user_profile");
      if (profile) {
        try {
          setUser(JSON.parse(profile));
        } catch (e) {}
      }
    };

    window.addEventListener("openwork_auth_changed", handleAuthChange);
    return () => window.removeEventListener("openwork_auth_changed", handleAuthChange);
  }, []);

  const login = async (email: string, pass: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !pass) {
        setIsLoading(false);
        return { success: false, error: "Please enter your email and password." };
      }

      // Profile mapping
      const userName = cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const role: UserRole = cleanEmail.includes("admin") || cleanEmail === "abhicm019@gmail.com" ? "admin" : "member";

      const authenticatedUser: UserProfile = {
        id: `user_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
        name: user.name || userName,
        email: cleanEmail,
        role: role,
        workspaceName: `${userName}'s Workspace`,
        jobTitle: "Team Member",
        avatarUrl: user.avatarUrl || "",
        workHours: "9:00 AM – 6:00 PM",
        soundEnabled: true,
        defaultSprintMins: 25
      };

      setUser(authenticatedUser);
      setIsAuthenticated(true);
      localStorage.setItem("openwork_auth_session", "true");
      localStorage.setItem("openwork_user_profile", JSON.stringify(authenticatedUser));
      window.dispatchEvent(new Event("openwork_auth_changed"));

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Authentication failed." };
    }
  };

  const signup = async (email: string, pass: string, name: string): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim() || cleanEmail.split("@")[0];

      if (!cleanEmail || !pass) {
        setIsLoading(false);
        return { success: false, error: "Please fill in all registration fields." };
      }

      const role: UserRole = cleanEmail === "abhicm019@gmail.com" ? "admin" : "member";

      const newUser: UserProfile = {
        id: `user_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`,
        name: cleanName,
        email: cleanEmail,
        role: role,
        workspaceName: `${cleanName}'s Workspace`,
        jobTitle: "Product Team",
        avatarUrl: "",
        workHours: "9:00 AM – 6:00 PM",
        soundEnabled: true,
        defaultSprintMins: 25
      };

      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem("openwork_auth_session", "true");
      localStorage.setItem("openwork_user_profile", JSON.stringify(newUser));
      window.dispatchEvent(new Event("openwork_auth_changed"));

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Registration failed." };
    }
  };

  const loginWithOAuth = async (provider: "google" | "microsoft" | "github"): Promise<AuthResult> => {
    try {
      setIsLoading(true);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || `Failed to authenticate with ${provider}.` };
    }
  };

  const logout = () => {
    localStorage.removeItem("openwork_auth_session");
    localStorage.removeItem("openwork_user_profile");
    setIsAuthenticated(false);
    setUser(defaultUser);
    window.dispatchEvent(new Event("openwork_auth_changed"));
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
    window.dispatchEvent(new Event("openwork_auth_changed"));
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
