"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { setSoundEnabled as setGlobalSoundEnabled } from "@/lib/sound";
import { detectModelsFromApiKey, detectOllamaModels, sendAIChatRequest, extractValidHttpUrl } from "@/lib/ai";
import { 
  User, 
  Settings, 
  Upload, 
  Check, 
  Download, 
  FileUp, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Sparkles, 
  Bot, 
  Key, 
  Cpu, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Globe,
  Copy
} from "lucide-react";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
];

const OLLAMA_PRESETS = ["llama3.2", "deepseek-r1", "qwen2.5", "mistral", "phi3", "gemma2"];

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

  // AI Config states: provider is either "ollama" or "cloud"
  const isInitialOllama = aiConfig.provider === "ollama";
  const [aiProvider, setAiProvider] = useState<"ollama" | "cloud">(isInitialOllama ? "ollama" : "cloud");
  const [aiApiKey, setAiApiKey] = useState(aiConfig.apiKey || "");
  const [ollamaEndpoint, setOllamaEndpoint] = useState(
    aiConfig.ollamaUrl || (aiConfig.baseUrl && aiConfig.baseUrl.includes("11434") ? aiConfig.baseUrl : "http://127.0.0.1:11434")
  );
  const [customApiEndpoint, setCustomApiEndpoint] = useState(
    aiConfig.baseUrl && !aiConfig.baseUrl.includes("11434") && !aiConfig.baseUrl.includes("cloudflared") ? aiConfig.baseUrl : ""
  );
  const [aiModel, setAiModel] = useState(aiConfig.model || (isInitialOllama ? "llama3.2" : "gpt-4o-mini"));
  const [showAdvancedUrl, setShowAdvancedUrl] = useState(Boolean(aiConfig.baseUrl && !aiConfig.baseUrl.includes("127.0.0.1") && !aiConfig.baseUrl.includes("11434")));

  // Auto-detected Cloud & Ollama Models
  const [detectedProviderName, setDetectedProviderName] = useState<string>("");
  const [detectedModels, setDetectedModels] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

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

  // Trigger Model Auto-Detection when API key changes
  const runAutoDetection = useCallback(async (key: string, url = "") => {
    if (!key || key.trim().length < 6) {
      setDetectedModels([]);
      setDetectedProviderName("");
      return;
    }

    setIsDetecting(true);
    try {
      const result = await detectModelsFromApiKey(key, url);
      setDetectedProviderName(result.providerName);
      setDetectedModels(result.models);

      // Auto-select the first high-performance model if current model is empty, default, or retired
      if (result.models.length > 0) {
        const isCurrentInvalid = 
          !aiModel || 
          aiModel === "gpt-4o-mini" || 
          aiModel === "llama3.2" || 
          aiModel.includes("llama-3.3-70b") || 
          !result.models.includes(aiModel);

        if (isCurrentInvalid) {
          const defaultChoice = result.models[0];
          setAiModel(defaultChoice);
          setAiProvider("cloud");
          updateAIConfig({ provider: "cloud", model: defaultChoice });
        }
      }
    } catch (e) {
      console.warn("Auto-detect models error:", e);
    } finally {
      setIsDetecting(false);
    }
  }, [aiModel, updateAIConfig]);

  const [isOllamaRunning, setIsOllamaRunning] = useState<boolean | null>(null);

  // Scan Local Ollama Models
  const fetchOllamaModels = async () => {
    setIsDetecting(true);
    try {
      const sanitizedUrl = extractValidHttpUrl(ollamaEndpoint) || "http://127.0.0.1:11434";
      const result = await detectOllamaModels(sanitizedUrl);
      setIsOllamaRunning(result.isConnected);
      setDetectedProviderName("Local Ollama");

      if (result.isConnected && result.models.length > 0) {
        setDetectedModels(result.models);
        // If current model is empty, default or not installed, pick the first installed model
        if (!aiModel || aiModel === "gpt-4o-mini" || (!result.models.includes(aiModel) && !result.models.includes(`${aiModel}:latest`))) {
          const defaultOllama = result.models[0];
          setAiModel(defaultOllama);
          updateAIConfig({ model: defaultOllama });
        }
      } else {
        setDetectedModels(OLLAMA_PRESETS);
      }
    } catch (e) {
      setIsOllamaRunning(false);
      setDetectedModels(OLLAMA_PRESETS);
      setDetectedProviderName("Local Ollama");
    } finally {
      setIsDetecting(false);
    }
  };

  // Run detection on mount / provider switch
  useEffect(() => {
    if (aiProvider === "ollama") {
      fetchOllamaModels();
    } else if (aiApiKey) {
      runAutoDetection(aiApiKey, customApiEndpoint);
    }
  }, [aiProvider]);

  // Sync with store when aiConfig updates
  useEffect(() => {
    if (aiConfig.model) setAiModel(aiConfig.model);
    if (aiConfig.provider) {
      setAiProvider(aiConfig.provider === "ollama" ? "ollama" : "cloud");
    }
    if (aiConfig.apiKey !== undefined) setAiApiKey(aiConfig.apiKey);
    if (aiConfig.ollamaUrl) {
      setOllamaEndpoint(aiConfig.ollamaUrl);
    } else if (aiConfig.baseUrl && aiConfig.baseUrl.includes("11434")) {
      setOllamaEndpoint(aiConfig.baseUrl);
    }
    if (aiConfig.baseUrl && !aiConfig.baseUrl.includes("11434") && !aiConfig.baseUrl.includes("cloudflared")) {
      setCustomApiEndpoint(aiConfig.baseUrl);
    }
  }, [aiConfig]);

  const [copiedTunnelCmd, setCopiedTunnelCmd] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedTunnelCmd(label);
      setTimeout(() => setCopiedTunnelCmd(null), 2500);
    } catch (e) {}
  };

  // Handle field change and trigger auto-detect
  const handleAIFieldChange = (field: "provider" | "apiKey" | "ollamaUrl" | "baseUrl" | "model", value: any) => {
    if (field === "provider") {
      setAiProvider(value);
      if (value === "ollama") {
        const defaultOllama = "llama3.2";
        setAiModel(defaultOllama);
        updateAIConfig({ provider: "ollama", model: defaultOllama });
      } else {
        const cloudChoice = detectedModels.length > 0 && !detectedModels[0].includes(":")
          ? detectedModels[0]
          : (aiApiKey.startsWith("nvapi-") ? "meta/llama-3.2-11b-vision-instruct" : "gpt-4o-mini");
        setAiModel(cloudChoice);
        updateAIConfig({ provider: "cloud", model: cloudChoice });
      }
    }

    if (field === "apiKey") {
      setAiApiKey(value);
      runAutoDetection(value, customApiEndpoint);
      updateAIConfig({ apiKey: value.trim() });
    }

    if (field === "ollamaUrl") {
      setOllamaEndpoint(value);
      const sanitized = extractValidHttpUrl(value);
      updateAIConfig({ ollamaUrl: sanitized || value, baseUrl: sanitized || value });
    }

    if (field === "baseUrl") {
      setCustomApiEndpoint(value);
      const sanitized = extractValidHttpUrl(value);
      if (aiApiKey) runAutoDetection(aiApiKey, sanitized);
      updateAIConfig({ baseUrl: sanitized });
    }

    if (field === "model") {
      setAiModel(value);
      const isCloud = value.includes("/") || value.startsWith("gpt-") || value.startsWith("gemini-") || value.startsWith("claude-") || value.startsWith("o1-") || value.startsWith("o3-");
      if (isCloud) {
        setAiProvider("cloud");
        updateAIConfig({ model: value.trim(), provider: "cloud" });
      } else {
        updateAIConfig({ model: value.trim() });
      }
    }
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

    const sanitizedOllama = extractValidHttpUrl(ollamaEndpoint) || "http://127.0.0.1:11434";
    const sanitizedCustom = extractValidHttpUrl(customApiEndpoint);
    const effectiveBaseUrl = aiProvider === "ollama" ? sanitizedOllama : sanitizedCustom;

    updateAIConfig({
      provider: aiProvider,
      apiKey: aiApiKey.trim(),
      baseUrl: effectiveBaseUrl,
      ollamaUrl: sanitizedOllama,
      model: aiModel.trim()
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Test AI Connection via Universal AI Client
  const testAIConnection = async () => {
    setIsTestingAI(true);
    setAiTestResult(null);

    // If user pasted a CLI command into the Ollama URL input
    if (aiProvider === "ollama" && (ollamaEndpoint.includes("cloudflared tunnel") || ollamaEndpoint.includes("ngrok http"))) {
      const extracted = extractValidHttpUrl(ollamaEndpoint);
      if (!extracted) {
        setAiTestResult({
          success: false,
          message: "You entered a terminal command! Run that command in your terminal/PowerShell first, then paste the generated https://... URL here."
        });
        setIsTestingAI(false);
        return;
      }
    }

    const sanitizedOllama = extractValidHttpUrl(ollamaEndpoint) || "http://127.0.0.1:11434";
    const sanitizedCustom = extractValidHttpUrl(customApiEndpoint);
    const effectiveBaseUrl = aiProvider === "ollama" ? sanitizedOllama : sanitizedCustom;

    // Persist active settings
    updateAIConfig({
      provider: aiProvider,
      apiKey: aiApiKey.trim(),
      baseUrl: effectiveBaseUrl,
      ollamaUrl: sanitizedOllama,
      model: aiModel.trim()
    });

    const res = await sendAIChatRequest({
      provider: aiProvider,
      apiKey: aiApiKey.trim(),
      baseUrl: effectiveBaseUrl,
      model: aiModel.trim(),
      messages: [{ role: "user", content: "Respond with 'AI Copilot Connected!' in exactly 3 words." }]
    });

    if (res.error) {
      setAiTestResult({ success: false, message: res.error });
    } else {
      setAiTestResult({
        success: true,
        message: `Connected successfully! Response: "${res.reply.trim()}"`
      });
    }
    setIsTestingAI(false);
  };

  // Export full workspace as JSON
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
        if (parsed.profile) updateProfile(parsed.profile);
        if (parsed.aiConfig) updateAIConfig(parsed.aiConfig);
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
            Choose between 100% free Local Ollama (private & offline) or enter any Cloud AI API key with automatic model detection.
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
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Any API Key & Auto-Detected Models</div>
                  </div>
                </div>
                {aiProvider === "cloud" && <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Works with OpenAI, Groq, NVIDIA NIM, Google Gemini, DeepSeek, OpenRouter, or custom APIs.
              </p>
            </button>
          </div>

          {/* Configuration Inputs */}
          {aiProvider === "ollama" ? (
            /* Mode 1: Local Ollama (Model Name + Endpoint + Scan + Cloudflare Guide) */
            <div className="space-y-4 pt-2">
              {/* Field 1: Ollama Model Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Bot size={13} className="text-blue-500" />
                      <span>Ollama Model Name</span>
                    </label>
                    {isOllamaRunning === true && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 animate-in fade-in">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Ollama Connected</span>
                      </span>
                    )}
                    {isOllamaRunning === false && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center gap-1 animate-in fade-in">
                        <span>Offline / Insecure Block</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={fetchOllamaModels}
                    className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline font-semibold cursor-pointer"
                  >
                    <RefreshCw size={11} className={isDetecting ? "animate-spin" : ""} />
                    <span>Scan Installed Models</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {detectedModels.length > 0 && (
                    <select
                      value={aiModel}
                      onChange={(e) => handleAIFieldChange("model", e.target.value)}
                      className="sm:w-1/2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 cursor-pointer shadow-2xs font-semibold text-blue-600 dark:text-blue-400"
                    >
                      {detectedModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => handleAIFieldChange("model", e.target.value)}
                    placeholder="e.g. llama3.2:latest, llama3.2, deepseek-r1"
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>

                {/* Quick Model Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {isOllamaRunning ? "Detected on PC:" : "Popular:"}
                  </span>
                  {detectedModels.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAIFieldChange("model", preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                        aiModel === preset || aiModel === preset.split(":")[0]
                          ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                          : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      {isOllamaRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Ollama Endpoint URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Globe size={13} className="text-emerald-500" />
                    <span>Ollama Endpoint URL</span>
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                    Local port or HTTPS tunnel
                  </span>
                </div>
                <input
                  type="text"
                  value={ollamaEndpoint}
                  onChange={(e) => handleAIFieldChange("ollamaUrl", e.target.value)}
                  placeholder="http://127.0.0.1:11434 or https://your-tunnel.trycloudflare.com"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 shadow-2xs"
                />
                {ollamaEndpoint && (ollamaEndpoint.includes("cloudflared tunnel") || ollamaEndpoint.includes("ngrok http")) && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 pt-1 animate-in fade-in">
                    <AlertCircle size={13} className="flex-shrink-0 text-amber-500" />
                    <span>
                      Notice: That is a terminal command! Run that command in your terminal, then paste the generated <code>https://...</code> URL here.
                    </span>
                  </p>
                )}
              </div>

              {/* Cloudflare Pages / HTTPS ➔ Localhost Guide Card */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Using Ollama on Cloudflare (HTTPS)?
                  </span>
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  Web browsers automatically block HTTPS websites from directly connecting to insecure <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-blue-900 dark:text-blue-200 font-semibold">http://localhost:11434</code> (Mixed Content Security Policy). To connect local Ollama from Cloudflare, run a free 1-line tunnel on your PC:
                </p>

                <div className="space-y-2">
                  {/* Option 1: Free Cloudflare Tunnel */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs font-mono shadow-2xs">
                    <div className="truncate text-slate-800 dark:text-zinc-200 text-[11px]">
                      <span className="text-blue-500 font-bold font-sans mr-1.5">[Recommended]</span>
                      <span>cloudflared tunnel --url http://localhost:11434</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("cloudflared tunnel --url http://localhost:11434", "cloudflared")}
                      className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold font-sans transition-colors cursor-pointer ml-2 flex-shrink-0 flex items-center gap-1"
                    >
                      {copiedTunnelCmd === "cloudflared" ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedTunnelCmd === "cloudflared" ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>

                  {/* Option 2: ngrok */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs font-mono shadow-2xs">
                    <div className="truncate text-slate-800 dark:text-zinc-200 text-[11px]">
                      <span className="text-purple-500 font-bold font-sans mr-1.5">[Alternative]</span>
                      <span>ngrok http 11434</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("ngrok http 11434", "ngrok")}
                      className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[10px] font-bold font-sans transition-colors cursor-pointer ml-2 flex-shrink-0 flex items-center gap-1"
                    >
                      {copiedTunnelCmd === "ngrok" ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedTunnelCmd === "ngrok" ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-blue-700 dark:text-blue-300">
                  ⚡ Paste the generated <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-blue-900 dark:text-blue-200 font-semibold">https://...trycloudflare.com</code> URL into the <strong>Ollama Endpoint URL</strong> field above, and click <strong>Test Connection</strong>!
                </p>
              </div>
            </div>
          ) : (
            /* Mode 2: Cloud AI (Exactly 2 Fields: API Key & Model Name with Auto-Detection) */
            <div className="space-y-4 pt-2">
              {/* Field 1: API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Key size={13} className="text-purple-500" />
                    <span>AI Provider API Key</span>
                  </label>

                  {/* Auto-detected Provider Badge */}
                  {detectedProviderName && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1 animate-in fade-in">
                      <Zap size={10} className="text-purple-500" />
                      <span>{detectedProviderName}</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => handleAIFieldChange("apiKey", e.target.value)}
                    placeholder="Paste any API key (sk-..., gsk_..., nvapi-..., AIzaSy..., sk-or-...)"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 shadow-2xs pr-10"
                  />
                  {isDetecting && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={14} className="animate-spin text-purple-500" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Enter your key — models are automatically detected and populated below.
                </p>
              </div>

              {/* Field 2: Auto-Detected Model Selector & Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Bot size={13} className="text-blue-500" />
                    <span>Model Name</span>
                  </label>

                  {detectedModels.length > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>{detectedModels.length} Models Available</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {detectedModels.length > 0 && (
                    <select
                      value={aiModel}
                      onChange={(e) => handleAIFieldChange("model", e.target.value)}
                      className="sm:w-1/2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 cursor-pointer shadow-2xs font-semibold text-blue-600 dark:text-blue-400"
                    >
                      {detectedModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => handleAIFieldChange("model", e.target.value)}
                    placeholder="e.g. gpt-4o-mini, llama-3.3-70b-versatile, gemini-2.0-flash, deepseek-chat"
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>

                {/* Quick Model Suggestion Chips */}
                {detectedModels.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">Auto-detected:</span>
                    {detectedModels.slice(0, 6).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAIFieldChange("model", preset)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                          aiModel === preset
                            ? "bg-purple-600 text-white border-purple-600 font-semibold"
                            : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Expandable Optional Custom Base URL */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedUrl(!showAdvancedUrl)}
                  className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {showAdvancedUrl ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  <span>Advanced: Custom API Endpoint / Proxy (Optional)</span>
                </button>

                {showAdvancedUrl && (
                  <div className="mt-2 space-y-1 animate-in fade-in">
                    <input
                      type="text"
                      value={customApiEndpoint}
                      onChange={(e) => handleAIFieldChange("baseUrl", e.target.value)}
                      placeholder="e.g. https://openrouter.ai/api/v1 or https://api.groq.com/openai/v1"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Leave blank to auto-route from your API key.
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
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
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
                {aiTestResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} className="flex-shrink-0" />}
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
                  className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
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
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Download size={14} className="text-amber-500" />
              <span>Export JSON Backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
