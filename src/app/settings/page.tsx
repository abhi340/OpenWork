"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { setSoundEnabled as setGlobalSoundEnabled } from "@/lib/sound";
import { 
  User, 
  Settings, 
  Upload, 
  Check, 
  Download, 
  FileUp, 
  Trash2, 
  Clock, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Sparkles, 
  Command, 
  Sun, 
  Moon,
  Laptop,
  Image as ImageIcon,
  Bot,
  Key,
  Globe,
  Cpu,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
];

export default function EmployeeSettingsPage() {
  const { user, updateProfile, aiConfig, updateAIConfig } = useAuth();
  const { theme, setTheme } = useTheme();
  const { blocks, fetchBlocks, addBlock } = useWorkspaceStore();

  // Profile Form states
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [jobTitle, setJobTitle] = useState(user.jobTitle || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || AVATAR_PRESETS[0]);
  const [workHours, setWorkHours] = useState(user.workHours || "9:00 AM – 6:00 PM");
  const [soundEnabled, setSoundEnabled] = useState(user.soundEnabled ?? true);
  const [defaultSprintMins, setDefaultSprintMins] = useState(user.defaultSprintMins || 25);

  // AI Config states
  const [aiProvider, setAiProvider] = useState(aiConfig.provider || "ollama");
  const [aiApiKey, setAiApiKey] = useState(aiConfig.apiKey || "");
  const [aiBaseUrl, setAiBaseUrl] = useState(aiConfig.baseUrl || "http://127.0.0.1:11434");
  const [aiModel, setAiModel] = useState(aiConfig.model || "llama3.2");

  // Available models (Local Ollama, NVIDIA NIM, Groq, OpenRouter, OpenAI, Gemini)
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WebP, SVG, etc.).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        updateProfile({ avatarUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto-fetch available models from provider API
  const fetchAvailableModels = async () => {
    setIsLoadingModels(true);
    try {
      const url = `/api/ai/models?provider=${encodeURIComponent(aiProvider)}&baseUrl=${encodeURIComponent(aiBaseUrl)}&apiKey=${encodeURIComponent(aiApiKey)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.models && Array.isArray(data.models) && data.models.length > 0) {
        setAvailableModels(data.models);
        if (!aiModel || !data.models.includes(aiModel)) {
          const first = data.models[0];
          setAiModel(first);
          updateAIConfig({ model: first });
        }
      } else {
        setAvailableModels([]);
      }
    } catch (e) {
      console.log("Could not auto-fetch models", e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (aiProvider === "ollama" || (aiApiKey && aiApiKey.length > 5)) {
      fetchAvailableModels();
    } else {
      setAvailableModels([]);
    }
  }, [aiProvider, aiBaseUrl, aiApiKey]);

  // Sync with store when aiConfig updates
  useEffect(() => {
    if (aiConfig.model) setAiModel(aiConfig.model);
    if (aiConfig.provider) setAiProvider(aiConfig.provider);
    if (aiConfig.baseUrl) {
      if (aiConfig.provider === "nvidia" && (aiConfig.baseUrl.includes("127.0.0.1") || aiConfig.baseUrl.includes("localhost"))) {
        setAiBaseUrl("https://integrate.api.nvidia.com/v1");
      } else {
        setAiBaseUrl(aiConfig.baseUrl);
      }
    }
    if (aiConfig.apiKey !== undefined) setAiApiKey(aiConfig.apiKey);
  }, [aiConfig]);

  // Update AI setting instantly and notify store
  const handleAIFieldChange = (field: "provider" | "apiKey" | "baseUrl" | "model", value: any) => {
    if (field === "provider") setAiProvider(value);
    if (field === "apiKey") setAiApiKey(value);
    if (field === "baseUrl") setAiBaseUrl(value);
    if (field === "model") setAiModel(value);

    updateAIConfig({ [field]: value });
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      jobTitle,
      avatarUrl,
      workHours,
      soundEnabled,
      defaultSprintMins
    });

    updateAIConfig({
      provider: aiProvider,
      apiKey: aiApiKey,
      baseUrl: aiBaseUrl,
      model: aiModel
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const testAIConnection = async () => {
    setIsTestingAI(true);
    setAiTestResult(null);

    // Save active config immediately
    updateAIConfig({
      provider: aiProvider,
      apiKey: aiApiKey,
      baseUrl: aiBaseUrl,
      model: aiModel
    });

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey,
          baseUrl: aiBaseUrl,
          model: aiModel,
          messages: [{ role: "user", content: "Say 'AI Copilot Connected!' in 3 words." }]
        })
      });

      const data = await res.json();
      if (data.error) {
        setAiTestResult({ success: false, message: data.error });
      } else {
        setAiTestResult({ success: true, message: `Connected successfully! Response: "${data.reply}"` });
      }
    } catch (err: any) {
      setAiTestResult({ success: false, message: `Connection error: ${err.message}` });
    } finally {
      setIsTestingAI(false);
    }
  };

  // Export full workspace as JSON (Security: Strip private API keys)
  const exportWorkspaceBackup = () => {
    const sanitizedAIConfig = {
      ...aiConfig,
      apiKey: "" // Redacted for security to prevent credential leakage
    };

    const backupData = {
      profile: user,
      aiConfig: sanitizedAIConfig,
      blocks,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openwork-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  // Import / Restore workspace from JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profile) {
          updateProfile(parsed.profile);
        }
        if (parsed.aiConfig) {
          updateAIConfig(parsed.aiConfig);
        }
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          for (const b of parsed.blocks) {
            await addBlock({
              title: b.title,
              type: b.type,
              config: b.config || {},
              items: b.items || [],
              order_index: b.order_index ?? 0
            });
          }
        }
        setImportStatus("Workspace & blocks restored successfully!");
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err) {
        setImportStatus("Invalid backup file format.");
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-8 text-slate-900 dark:text-zinc-100">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings size={22} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              Personal Preferences & Profile
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Customize your worker identity, AI copilot keys/Ollama models, and local data backups.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: AI Copilot (Bring Your Own Key or Local Ollama) */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Bot size={18} className="text-blue-600 dark:text-blue-400" />
              <span>AI Copilot Provider (BYO-Key / Local Ollama)</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
              Instant Sync
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Power your floating AI Copilot using 100% free Local Ollama (completely private & offline) or your own API key (OpenAI, Groq, OpenRouter, Gemini).
          </p>

          {/* Provider Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: "ollama", label: "Local Ollama", desc: "100% Free & Private", icon: Cpu },
              { id: "nvidia", label: "NVIDIA NIM", desc: "Free Cloud Llama/DeepSeek", icon: Sparkles },
              { id: "groq", label: "Groq (Fast)", desc: "Llama-3.3-70b", icon: Globe },
              { id: "openai", label: "OpenAI / Custom", desc: "GPT-4o / Compatible", icon: Key },
              { id: "gemini", label: "Google Gemini", desc: "Gemini 1.5/2.0 Flash", icon: Sparkles },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = aiProvider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    let newBaseUrl = aiBaseUrl;
                    let newModel = aiModel;

                    if (p.id === "ollama") {
                      newBaseUrl = "http://127.0.0.1:11434";
                      newModel = "llama3.2";
                    } else if (p.id === "nvidia") {
                      newBaseUrl = "https://integrate.api.nvidia.com/v1";
                      newModel = "nvidia/llama-3.1-nemotron-70b-instruct";
                    } else if (p.id === "groq") {
                      newBaseUrl = "https://api.groq.com/openai/v1";
                      newModel = "llama-3.3-70b-versatile";
                    } else if (p.id === "openai") {
                      newBaseUrl = "https://api.openai.com/v1";
                      newModel = "gpt-4o-mini";
                    } else if (p.id === "gemini") {
                      newBaseUrl = "";
                      newModel = "gemini-1.5-flash";
                    }

                    setAiProvider(p.id as any);
                    setAiBaseUrl(newBaseUrl);
                    setAiModel(newModel);
                    setAiTestResult(null);

                    updateAIConfig({
                      provider: p.id as any,
                      baseUrl: newBaseUrl,
                      model: newModel
                    });
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20 font-semibold"
                      : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400"
                  }`}
                >
                  <Icon size={16} className="mb-1 text-blue-500" />
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500">{p.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Provider Specific Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {aiProvider !== "ollama" && (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {aiProvider === "gemini" ? "Google Gemini API Key" : "API Key"}
                </label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => handleAIFieldChange("apiKey", e.target.value)}
                  placeholder="sk-... or AIza..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500"
                />
              </div>
            )}

            {aiProvider !== "gemini" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Base URL Endpoint
                </label>
                <input
                  type="text"
                  value={aiBaseUrl}
                  onChange={(e) => handleAIFieldChange("baseUrl", e.target.value)}
                  placeholder={aiProvider === "ollama" ? "http://127.0.0.1:11434" : "https://api.openai.com/v1"}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Model Name
                </label>
                <button
                  type="button"
                  onClick={fetchAvailableModels}
                  className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  <RefreshCw size={10} className={isLoadingModels ? "animate-spin" : ""} />
                  <span>Auto-Detect Models</span>
                </button>
              </div>

              {/* If models detected, show dropdown with custom override option */}
              {availableModels.length > 0 ? (
                <div className="flex gap-2">
                  <select
                    value={aiModel}
                    onChange={(e) => handleAIFieldChange("model", e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => handleAIFieldChange("model", e.target.value)}
                    placeholder="Or custom..."
                    className="w-36 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => handleAIFieldChange("model", e.target.value)}
                  placeholder="e.g. nvidia/llama-3.1-nemotron-70b-instruct, gpt-4o-mini, gemini-1.5-flash"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={testAIConnection}
              disabled={isTestingAI}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isTestingAI ? (
                <>
                  <Loader2 size={13} className="animate-spin text-blue-500" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Test AI Connection</span>
                </>
              )}
            </button>

            {aiTestResult && (
              <div
                className={`text-xs flex items-center gap-1.5 font-medium ${
                  aiTestResult.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                }`}
              >
                {aiTestResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span className="truncate max-w-md">{aiTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Profile & Avatar */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <User size={16} className="text-blue-500" />
            <span>Worker Profile & Avatar</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-2">
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 dark:border-zinc-700 shadow-sm"
              />
              <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                Avatar Preview
              </span>
            </div>

            {/* Avatar Preset Selectors */}
            <div className="space-y-2 flex-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Choose Avatar or Custom Image URL
              </label>
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all ${
                      avatarUrl === preset
                        ? "border-blue-600 ring-2 ring-blue-500/20 scale-105"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:border-blue-500 flex items-center gap-1.5 text-xs font-semibold shadow-2xs transition-all"
                >
                  <Upload size={13} className="text-blue-500" />
                  <span>Upload Local Photo</span>
                </button>
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  onChange={handleAvatarFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/your-avatar.jpg"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Name & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Job Title / Specialization
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer, Sales SDR"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Daily Work Hours
              </label>
              <input
                type="text"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                placeholder="9:00 AM – 6:00 PM"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Focus & Sound Preferences */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <span>Workflow & Focus Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Default Focus Sprint Duration
              </label>
              <div className="flex gap-2">
                {[15, 25, 45, 50, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDefaultSprintMins(mins)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      defaultSprintMins === mins
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  Sound Feedback & Chimes
                </div>
                <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Play subtle chimes when timers & batch goals finish.
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => {
                  setSoundEnabled(e.target.checked);
                  setGlobalSoundEnabled(e.target.checked);
                }}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-zinc-700 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Data Ownership & Backup Hub */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Data Ownership & Local Backup Hub</span>
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              100% Private
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Export your entire workspace configuration, tables, AI keys, and routine templates into a portable JSON backup file.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={exportWorkspaceBackup}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Download size={14} className="text-blue-500" />
              <span>Export Full Workspace Backup (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <FileUp size={14} className="text-emerald-500" />
              <span>Restore Workspace from File</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {importStatus}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            {savedSuccess ? (
              <>
                <Check size={15} />
                <span>Saved All Settings & AI Keys!</span>
              </>
            ) : (
              <span>Save Profile & AI Settings</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
