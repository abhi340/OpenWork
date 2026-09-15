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
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
];

const OLLAMA_PRESETS = ["llama3.2", "deepseek-r1", "qwen2.5", "mistral", "phi3", "gemma2"];
const CLOUD_PRESETS = ["gpt-4o-mini", "llama-3.3-70b-versatile", "gemini-2.0-flash", "deepseek-chat", "gpt-4o"];

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

  // AI Config states: provider is either "ollama" or "cloud" (or legacy names)
  const isInitialOllama = aiConfig.provider === "ollama";
  const [aiProvider, setAiProvider] = useState<"ollama" | "cloud">(isInitialOllama ? "ollama" : "cloud");
  const [aiApiKey, setAiApiKey] = useState(aiConfig.apiKey || "");
  const [aiBaseUrl, setAiBaseUrl] = useState(aiConfig.baseUrl || "");
  const [aiModel, setAiModel] = useState(aiConfig.model || (isInitialOllama ? "llama3.2" : "gpt-4o-mini"));
  const [showAdvancedUrl, setShowAdvancedUrl] = useState(Boolean(aiConfig.baseUrl && !aiConfig.baseUrl.includes("127.0.0.1")));

  // Available models from local Ollama
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

  // Auto-fetch available models from local Ollama
  const fetchAvailableModels = async () => {
    if (aiProvider !== "ollama") return;
    setIsLoadingModels(true);
    try {
      const res = await fetch("http://127.0.0.1:11434/api/tags").catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          const names = data.models.map((m: any) => m.name.split(":")[0]);
          setAvailableModels(names);
          if (names.length > 0 && !names.includes(aiModel)) {
            setAiModel(names[0]);
            updateAIConfig({ model: names[0] });
          }
          return;
        }
      }
      setAvailableModels([]);
    } catch (e) {
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (aiProvider === "ollama") {
      fetchAvailableModels();
    }
  }, [aiProvider]);

  // Sync with store when aiConfig updates
  useEffect(() => {
    if (aiConfig.model) setAiModel(aiConfig.model);
    if (aiConfig.provider) {
      setAiProvider(aiConfig.provider === "ollama" ? "ollama" : "cloud");
    }
    if (aiConfig.apiKey !== undefined) setAiApiKey(aiConfig.apiKey);
    if (aiConfig.baseUrl !== undefined) setAiBaseUrl(aiConfig.baseUrl);
  }, [aiConfig]);

  // Update AI setting instantly and notify store
  const handleAIFieldChange = (field: "provider" | "apiKey" | "baseUrl" | "model", value: any) => {
    if (field === "provider") {
      setAiProvider(value);
      if (value === "ollama") {
        setAiBaseUrl("http://127.0.0.1:11434");
        if (!aiModel || aiModel.includes("gpt") || aiModel.includes("gemini")) {
          setAiModel("llama3.2");
        }
      } else {
        setAiBaseUrl("");
        if (!aiModel || aiModel === "llama3.2") {
          setAiModel("gpt-4o-mini");
        }
      }
    }
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
      baseUrl: aiProvider === "ollama" ? "http://127.0.0.1:11434" : aiBaseUrl,
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
      baseUrl: aiProvider === "ollama" ? "http://127.0.0.1:11434" : aiBaseUrl,
      model: aiModel
    });

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey,
          baseUrl: aiProvider === "ollama" ? "http://127.0.0.1:11434" : aiBaseUrl,
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
      apiKey: "" // Redacted for security
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
            Customize your worker identity, AI copilot models, and local data backups.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Streamlined AI Copilot Configuration */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Bot size={18} className="text-blue-600 dark:text-blue-400" />
              <span>AI Copilot Engine</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
              Instant Sync
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Choose between 100% free Local Ollama (private & offline) or connect any Cloud AI model with your API key.
          </p>

          {/* 2 Simple Mode Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: Local Ollama */}
            <button
              type="button"
              onClick={() => handleAIFieldChange("provider", "ollama")}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                aiProvider === "ollama"
                  ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Cpu size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">Local Ollama</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">100% Free & Private</div>
                  </div>
                </div>
                {aiProvider === "ollama" && <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Runs on your machine via Ollama. No API keys needed, zero data leaves your computer.
              </p>
            </button>

            {/* Card 2: Cloud AI (Any Model) */}
            <button
              type="button"
              onClick={() => handleAIFieldChange("provider", "cloud")}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                aiProvider === "cloud"
                  ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">Cloud AI Model</div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Any API Key & Model</div>
                  </div>
                </div>
                {aiProvider === "cloud" && <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Works with OpenAI, Groq, NVIDIA, Google Gemini, DeepSeek, OpenRouter, or custom APIs.
              </p>
            </button>
          </div>

          {/* Configuration Inputs based on mode */}
          {aiProvider === "ollama" ? (
            /* Mode 1: Local Ollama Settings (Only 1 input: Model Name) */
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Bot size={13} className="text-blue-500" />
                    <span>Ollama Model Name</span>
                  </label>
                  <button
                    type="button"
                    onClick={fetchAvailableModels}
                    className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw size={11} className={isLoadingModels ? "animate-spin" : ""} />
                    <span>Scan Installed Models</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  {availableModels.length > 0 ? (
                    <select
                      value={aiModel}
                      onChange={(e) => handleAIFieldChange("model", e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                    >
                      {availableModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => handleAIFieldChange("model", e.target.value)}
                    placeholder="e.g. llama3.2, deepseek-r1, qwen2.5, mistral"
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>

                {/* Quick Model Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Popular:</span>
                  {OLLAMA_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAIFieldChange("model", preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                        aiModel === preset
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Cloud AI (Exactly 2 Fields: API Key & Model Name) */
            <div className="space-y-4 pt-2">
              {/* Field 1: API Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Key size={13} className="text-purple-500" />
                  <span>AI Provider API Key</span>
                </label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => handleAIFieldChange("apiKey", e.target.value)}
                  placeholder="Paste your API key (sk-..., gsk_..., nvapi-..., AIzaSy..., etc.)"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 shadow-2xs"
                />
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Keys are stored encrypted locally on your browser and never logged.
                </p>
              </div>

              {/* Field 2: Model Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Bot size={13} className="text-blue-500" />
                  <span>Model Name</span>
                </label>
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => handleAIFieldChange("model", e.target.value)}
                  placeholder="e.g. gpt-4o-mini, llama-3.3-70b-versatile, gemini-2.0-flash, deepseek-chat"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 shadow-2xs"
                />

                {/* Quick Model Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Suggestions:</span>
                  {CLOUD_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAIFieldChange("model", preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                        aiModel === preset
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expandable Optional Custom Base URL */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedUrl(!showAdvancedUrl)}
                  className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 flex items-center gap-1 font-semibold"
                >
                  {showAdvancedUrl ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  <span>Advanced: Custom API Endpoint / Proxy (Optional)</span>
                </button>

                {showAdvancedUrl && (
                  <div className="mt-2 space-y-1 animate-in fade-in">
                    <input
                      type="text"
                      value={aiBaseUrl}
                      onChange={(e) => handleAIFieldChange("baseUrl", e.target.value)}
                      placeholder="e.g. https://openrouter.ai/api/v1 or https://api.groq.com/openai/v1"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Leave blank to auto-detect endpoint from your key format.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Connection Button & Result */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={testAIConnection}
              disabled={isTestingAI}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-2xs"
            >
              {isTestingAI ? (
                <>
                  <Loader2 size={13} className="animate-spin text-blue-500" />
                  <span>Pinging Model...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Test Connection</span>
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

              {/* Upload or Custom URL */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://... custom avatar URL"
                  className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Upload size={13} />
                  <span>Upload</span>
                </button>
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  onChange={handleAvatarFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Abhiram Kodicherla"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-medium"
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
                placeholder="name@company.com"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Job Title / Discipline
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Founder & Full-Stack Engineer"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Active Work Hours
              </label>
              <input
                type="text"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                placeholder="e.g. 9:00 AM – 6:00 PM"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Preferences & Audio */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Volume2 size={16} className="text-emerald-500" />
            <span>Workspace Audio & Sprint Defaults</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Audio Toggle */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  Acoustic Feedback
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Subtle synthetic mechanical clicks on task completion
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  setGlobalSoundEnabled(next);
                }}
                className={`p-2 rounded-xl transition-colors ${
                  soundEnabled
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                }`}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>

            {/* Default Sprint Duration */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  Default Sprint Timer
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Standard duration for new Focus Sprints
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[15, 25, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDefaultSprintMins(mins)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      defaultSprintMins === mins
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Data Portability & Backups */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Download size={16} className="text-amber-500" />
            <span>Workspace Data Portability</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Export a full JSON backup of your blocks and routines, or restore your configuration onto any device.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={exportWorkspaceBackup}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Download size={14} className="text-amber-500" />
              <span>Export JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <FileUp size={14} className="text-blue-500" />
              <span>Import & Restore</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />

            {importStatus && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
                {importStatus}
              </span>
            )}
          </div>
        </div>

        {/* Save Footer Bar */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Encrypted local session active</span>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                <Check size={14} />
                <span>Preferences Saved!</span>
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
