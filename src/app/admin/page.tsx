"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth, UserRole } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Activity, 
  Sliders, 
  Plus, 
  Trash2, 
  Check, 
  Download, 
  Key, 
  Lock,
  UserCheck,
  Mail,
  Palette,
  Sparkles,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Globe,
  BarChart3,
  TrendingUp,
  Layers
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "invited";
  joinedDate: string;
}

interface BlockerItem {
  id: string;
  user: string;
  role: string;
  blockerText: string;
  timestamp: string;
  resolved: boolean;
}

const initialTeam: TeamMember[] = [
  {
    id: "1",
    name: "Abhiram Kodicherla",
    email: "abhiramkodicherla@gmail.com",
    role: "admin",
    status: "active",
    joinedDate: "Today"
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    role: "manager",
    status: "active",
    joinedDate: "2 days ago"
  },
  {
    id: "3",
    name: "Marcus Vance",
    email: "marcus.v@company.com",
    role: "member",
    status: "active",
    joinedDate: "1 week ago"
  },
  {
    id: "4",
    name: "Elena Rostova",
    email: "elena.r@agency.io",
    role: "guest",
    status: "invited",
    joinedDate: "Pending"
  }
];

const initialBlockers: BlockerItem[] = [
  {
    id: "b1",
    user: "Marcus Vance",
    role: "Software Engineer",
    blockerText: "Waiting on DevOps for AWS staging environment credentials and S3 bucket access",
    timestamp: "25 mins ago",
    resolved: false
  },
  {
    id: "b2",
    user: "Sarah Chen",
    role: "Product Manager",
    blockerText: "Awaiting legal feedback on GDPR compliance checklist for EU customer trial",
    timestamp: "2 hours ago",
    resolved: false
  }
];

export default function AdminPanel() {
  const { user, setWorkspaceName, isAdmin, aiConfig } = useAuth();
  const [activeTab, setActiveTab] = useState<"members" | "standups" | "branding" | "features" | "ops" | "analytics">("members");
  const { blocks } = useWorkspaceStore();

  // Live test suite states
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isTestingAIChat, setIsTestingAIChat] = useState(false);
  const [aiChatResult, setAiChatResult] = useState<{ success: boolean; message: string } | null>(null);

  const testPocketBaseHealth = async () => {
    setIsTestingHealth(true);
    setHealthResult(null);
    try {
      const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
      const res = await fetch(`${pbUrl}/api/health`);
      if (res.ok) {
        setHealthResult({ success: true, message: `PocketBase API is Healthy (HTTP 200 OK) at ${pbUrl}` });
      } else {
        setHealthResult({ success: false, message: `PocketBase API returned status HTTP ${res.status}` });
      }
    } catch (e: any) {
      setHealthResult({ success: false, message: `Could not connect to PocketBase API: ${e.message}` });
    } finally {
      setIsTestingHealth(false);
    }
  };

  const testAICopilotService = async () => {
    setIsTestingAIChat(true);
    setAiChatResult(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          baseUrl: aiConfig.baseUrl,
          model: aiConfig.model,
          messages: [{ role: "user", content: "Ping test" }]
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAiChatResult({ success: true, message: `AI Service Live! Provider: ${aiConfig.provider} (${aiConfig.model})` });
      } else {
        setAiChatResult({ success: false, message: data.error || "AI Service connection failed." });
      }
    } catch (e: any) {
      setAiChatResult({ success: false, message: `Network error: ${e.message}` });
    } finally {
      setIsTestingAIChat(false);
    }
  };

  // Team state (must be declared before any conditional return to obey React Rules of Hooks)
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [blockers, setBlockers] = useState<BlockerItem[]>(initialBlockers);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<UserRole>("member");
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Branding state
  const [orgName, setOrgName] = useState(user.workspaceName);
  const [pipelineStatuses, setPipelineStatuses] = useState("To Do, In Progress, Review, Done");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [savedSettings, setSavedSettings] = useState(false);

  // Feature Toggles state
  const [toggles, setToggles] = useState({
    allowCustomBlocks: true,
    allowGuestScratchpad: false,
    autoTriageMidnight: true,
    requireAdminApproval: false
  });

  // Authorization Guard (AFTER all hooks)
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-slate-900 dark:text-zinc-100">
        <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center border border-red-200 dark:border-red-800/80 shadow-2xs">
            <Lock size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Access Restricted
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Administrator or manager credentials are required to access team rosters, workspace governance, and organization controls.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Return to Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: newMemberName.trim() || newMemberEmail.split("@")[0],
      email: newMemberEmail.trim(),
      role: newMemberRole,
      status: "invited",
      joinedDate: "Just now"
    };

    setTeam([...team, newMember]);
    setNewMemberName("");
    setNewMemberEmail("");
    setShowInviteModal(false);
  };

  const handleRoleChange = (id: string, role: UserRole) => {
    setTeam(team.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  const handleDeleteMember = (id: string) => {
    setTeam(team.filter((m) => m.id !== id));
  };

  const resolveBlocker = (id: string) => {
    setBlockers(blockers.map((b) => (b.id === id ? { ...b, resolved: true } : b)));
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    setWorkspaceName(orgName);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  const exportActivityLogs = () => {
    const logs = {
      workspace: orgName,
      exportedAt: new Date().toISOString(),
      activeTeamCount: team.length,
      members: team,
      activeBlockers: blockers.filter((b) => !b.resolved),
      statusPipeline: pipelineStatuses.split(",").map((s) => s.trim())
    };

    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openwork-audit-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const unresolvedCount = blockers.filter((b) => !b.resolved).length;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 text-slate-900 dark:text-zinc-100">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={24} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              Admin & Organization Console
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              Management
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Manage team roles (RBAC), unblock team bottlenecks, and configure organization branding.
          </p>
        </div>

        <button
          onClick={exportActivityLogs}
          className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs self-start md:self-auto"
        >
          <Download size={13} />
          <span>Export Workspace Audit</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-px">
        {[
          { id: "members", label: "Team & Roles (RBAC)", icon: Users },
          { 
            id: "standups", 
            label: "Team Standups & Blockers", 
            icon: AlertCircle, 
            badge: unresolvedCount > 0 ? `${unresolvedCount} Blocker` : undefined,
            badgeColor: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
          },
          { id: "branding", label: "Branding & Statuses", icon: Building2 },
          { id: "features", label: "Feature Permissions", icon: Sliders },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
          { id: "ops", label: "Operations & AI Health", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Team & Roles (RBAC) */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Workspace Members ({team.length})
            </h3>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Invite Member</span>
            </button>
          </div>

          <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950/80 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">User</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Role (RBAC)</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Joined</th>
                  <th className="py-3 px-4 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-zinc-300 uppercase">
                          {member.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-zinc-100">{member.name}</div>
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        className="bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-700 outline-none cursor-pointer"
                      >
                        <option value="admin">Super Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                        <option value="guest">Guest</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        member.status === "active" 
                          ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400" 
                          : "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400"
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-zinc-400">
                      {member.joinedDate}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {member.email !== user.email && (
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Remove user"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Manager Blocker Feed & Async Standup Digest */}
      {activeTab === "standups" && (
        <div className="space-y-6">
          {/* Active Blockers Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-red-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Active Escalated Blockers ({unresolvedCount})
              </h3>
            </div>

            {blockers.filter((b) => !b.resolved).length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>All team blockers are cleared! No team members are currently stuck.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {blockers.filter((b) => !b.resolved).map((blocker) => (
                  <div
                    key={blocker.id}
                    className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-red-900 dark:text-red-300">
                          {blocker.user}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 font-mono">
                          {blocker.role}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {blocker.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-zinc-200 font-medium">
                        "{blocker.blockerText}"
                      </p>
                    </div>

                    <button
                      onClick={() => resolveBlocker(blocker.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs flex-shrink-0"
                    >
                      <Check size={13} />
                      <span>Resolve & Unblock</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Async Team Standups Rollup */}
          <div className="pt-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <FileCheck2 size={16} className="text-blue-500" />
              <span>Today's Team Standup Submissions</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: "Abhiram Kodicherla", role: "Super Admin", batches: "5/5 targets met", hours: "2.5h sprint", status: "All green" },
                { name: "Sarah Chen", role: "Product Manager", batches: "3/3 user feedback sessions", hours: "1.5h sprint", status: "Spec in review" },
                { name: "Marcus Vance", role: "Software Engineer", batches: "4/6 PRs reviewed", hours: "3.2h code sprint", status: "Blocked on staging" },
                { name: "Elena Rostova", role: "Guest Contractor", batches: "2/2 design components", hours: "1.0h sprint", status: "Figma ready" },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-zinc-100">{s.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">{s.role}</div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                      {s.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                      <CheckCircle2 size={13} className="text-purple-500" />
                      <span className="font-mono text-slate-800 dark:text-zinc-200 font-semibold">{s.batches}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                      <Clock size={13} className="text-blue-500" />
                      <span className="font-mono text-slate-800 dark:text-zinc-200 font-semibold">{s.hours}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Branding & Status Pipelines */}
      {activeTab === "branding" && (
        <form onSubmit={handleSaveBranding} className="space-y-5 max-w-xl">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Workspace Identity
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Organization / Workspace Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Custom Task Status Pipeline
              </label>
              <input
                type="text"
                value={pipelineStatuses}
                onChange={(e) => setPipelineStatuses(e.target.value)}
                placeholder="To Do, In Progress, Review, Done"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Comma-separated stages for team tasks and table workflows.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 dark:border-zinc-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-zinc-400 uppercase">{primaryColor}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {savedSettings ? (
                  <>
                    <Check size={14} />
                    <span>Saved Changes!</span>
                  </>
                ) : (
                  <span>Save Organization Branding</span>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: Feature Toggles */}
      {activeTab === "features" && (
        <div className="space-y-4 max-w-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Granular Feature Toggles
          </h3>

          <div className="border border-slate-200 dark:border-zinc-800 rounded-xl divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
            {[
              { key: "allowCustomBlocks", label: "Employee Dynamic Block Creation", desc: "Allow non-admin members to build and customize their own work blocks freely." },
              { key: "autoTriageMidnight", label: "Daily Midnight Task Rollover", desc: "Automatically prompt employees to roll over incomplete tasks at the start of each day." },
              { key: "allowGuestScratchpad", label: "Guest Scratchpad Collaboration", desc: "Allow guest roles to edit scratchpads linked to assigned blocks." },
              { key: "requireAdminApproval", label: "Require Manager Standup Approval", desc: "Require manager sign-off on daily standup accomplishment submissions." },
            ].map((feat) => (
              <div key={feat.key} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">{feat.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{feat.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={(toggles as any)[feat.key]}
                  onChange={(e) => setToggles({ ...toggles, [feat.key]: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-zinc-700 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Operations & AI Health Test Suite */}
      {activeTab === "ops" && (
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Activity size={18} className="text-blue-600 dark:text-blue-400" />
                <span>System Operations & Diagnostic Test Suite</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Run live diagnostic pings, verify database health, and inspect active server AI fallbacks.
              </p>
            </div>
          </div>

          {/* Test Suite Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Test 1: PocketBase Health */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Building2 size={15} className="text-blue-500" />
                  <span>PocketBase DB API</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  SQLite Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Pings `/api/health` to verify database responsiveness and readiness.
              </p>

              {healthResult && (
                <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${healthResult.success ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
                  {healthResult.success ? <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
                  <span className="leading-snug">{healthResult.message}</span>
                </div>
              )}

              <button
                type="button"
                onClick={testPocketBaseHealth}
                disabled={isTestingHealth}
                className="w-full py-2 px-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Activity size={13} className={isTestingHealth ? "animate-spin text-blue-500" : "text-blue-500"} />
                <span>{isTestingHealth ? "Pinging DB..." : "Test PocketBase Health"}</span>
              </button>
            </div>

            {/* Test 2: AI Copilot Service */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Sparkles size={15} className="text-purple-500" />
                  <span>AI Copilot Service</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold uppercase">
                  {aiConfig.provider}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Pings `/api/ai/chat` to test active AI provider completion ({aiConfig.model}).
              </p>

              {aiChatResult && (
                <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${aiChatResult.success ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`}>
                  {aiChatResult.success ? <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
                  <span className="leading-snug">{aiChatResult.message}</span>
                </div>
              )}

              <button
                type="button"
                onClick={testAICopilotService}
                disabled={isTestingAIChat}
                className="w-full py-2 px-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Sparkles size={13} className={isTestingAIChat ? "animate-spin text-purple-500" : "text-purple-500"} />
                <span>{isTestingAIChat ? "Pinging AI..." : "Test AI Copilot Endpoint"}</span>
              </button>
            </div>
          </div>

          {/* Environment Status Summary */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Globe size={15} className="text-blue-500" />
              <span>Deployment & Environment Diagnostics</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200/60 dark:border-zinc-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Database Binding</div>
                <div className="font-mono text-slate-800 dark:text-zinc-200 truncate">
                  {process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090 (Default)"}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200/60 dark:border-zinc-800 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Active AI Copilot Model</div>
                <div className="font-mono text-slate-800 dark:text-zinc-200 truncate">
                  {aiConfig.provider.toUpperCase()} / {aiConfig.model}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Analytics */}
      {activeTab === "analytics" && (
        <AnalyticsTab blocks={blocks} team={team} blockers={blockers} />
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form 
            onSubmit={handleInvite} 
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                Invite Team Member
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Grant role-based access to your OpenWork workspace.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Name</label>
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Email Address</label>
              <input
                type="email"
                required
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="alex.r@company.com"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Role</label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="member">Member (Standard Employee)</option>
                <option value="manager">Manager (Can view team summaries)</option>
                <option value="admin">Super Admin (Full config & RBAC control)</option>
                <option value="guest">Guest (Restricted view)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ blocks, team, blockers }: { blocks: any[]; team: TeamMember[]; blockers: BlockerItem[] }) {
  const stats = useMemo(() => {
    const totalBlocks = blocks.length;
    const blockTypes = blocks.reduce((acc: Record<string, number>, b: any) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {});

    const totalChecklistItems = blocks
      .filter((b: any) => b.type === "checklist")
      .reduce((sum: number, b: any) => sum + (b.items?.length || 0), 0);

    const completedChecklistItems = blocks
      .filter((b: any) => b.type === "checklist")
      .reduce((sum: number, b: any) => sum + (b.items?.filter((i: any) => i.completed)?.length || 0), 0);

    const totalCounterValue = blocks
      .filter((b: any) => b.type === "counter_batch")
      .reduce((sum: number, b: any) => sum + (b.config?.count || 0), 0);

    return {
      totalBlocks,
      blockTypes,
      totalChecklistItems,
      completedChecklistItems,
      checklistCompletionRate: totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 0,
      totalCounterValue,
      activeMembers: team.filter((m) => m.status === "active").length,
      unresolvedBlockers: blockers.filter((b) => !b.resolved).length
    };
  }, [blocks, team, blockers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Layers size={14} className="text-blue-500" />
            <span>Active Blocks</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{stats.totalBlocks}</div>
          <div className="text-[10px] text-slate-400">Configured on board</div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span>Task Completion</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.checklistCompletionRate}%
          </div>
          <div className="text-[10px] text-slate-400">
            {stats.completedChecklistItems}/{stats.totalChecklistItems} checklist items done
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Users size={14} className="text-indigo-500" />
            <span>Active Team</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{stats.activeMembers}</div>
          <div className="text-[10px] text-slate-400">Workspace collaborators</div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-amber-500" />
            <span>Total Units Logged</span>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalCounterValue}</div>
          <div className="text-[10px] text-slate-400">Across all counter batches</div>
        </div>
      </div>

      {/* Block Type Breakdown & Health Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xs space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart3 size={15} className="text-blue-500" />
            <span>Widget Engine Distribution</span>
          </h4>

          {Object.keys(stats.blockTypes).length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">No active blocks configured yet.</div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(stats.blockTypes).map(([type, count]) => {
                const pct = Math.round((count / (stats.totalBlocks || 1)) * 100);
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-zinc-300">
                      <span className="capitalize">{type.replace(/_/g, " ")}</span>
                      <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xs space-y-4">
          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles size={15} className="text-amber-500" />
            <span>Team Efficiency Summary</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Active Unresolved Blockers</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${stats.unresolvedBlockers > 0 ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                {stats.unresolvedBlockers}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Total Registered Members</span>
              <span className="font-bold text-slate-900 dark:text-zinc-100 font-mono">{team.length}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-lg border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-slate-600 dark:text-zinc-400">Workspace Status</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

