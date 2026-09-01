<div align="center">

# ⚡ OpenWork
### High-Velocity Modular Execution Cockpit & Personal Workplace OS

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PocketBase](https://img.shields.io/badge/PocketBase-SQLite%20WAL-b8860b?style=flat&logo=pocketbase)](https://pocketbase.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*A modern, customizable personal execution dashboard built for high-performance knowledge workers, featuring autonomous AI Copilot widget generation, real-time database sync, and executive organization governance.*

</div>

---

## 🌟 Key Features

### 🎛️ 1. Modular Dynamic Widget System
* **Counter Batches**: Batch progress tracking with target caps, blocker logging, and milestone celebrations.
* **Sprint Timers**: Integrated focus sessions with customizable intervals, audio alarms, and status indicators.
* **Smart Checklists**: Task hierarchies with subtask indentation, tags, and progress bars.
* **Lead / Task Tables**: Multi-column data grids with inline editing and status badges.
* **Kanban Execution Pipelines**: Customizable drag-and-drop workflow stages.
* **Metric KPIs & Milestone Trackers**: Numerical target metrics with step adjustments and deadline counters.
* **Daily Link Hub Dock**: Quick launchpad bookmarks for high-frequency tools.

### 🤖 2. Floating AI Execution Copilot
* **Autonomous Widget Construction**: Build and deploy customized widgets directly to your dashboard in 1 click using natural language commands.
* **Multi-Provider AI Architecture**:
  * **Local Ollama**: 100% free, offline, and private AI execution (`llama3.2`, `deepseek-r1`, etc.).
  * **NVIDIA NIM Cloud**: Flagship models via high-speed API endpoints.
  * **Groq Cloud**: Ultra-low latency Llama-3.3-70B.
  * **OpenAI & Compatible Endpoints**: GPT-4o / GPT-4o-mini / Custom HTTPS proxies.
  * **Google Gemini**: Gemini 1.5 Flash / Gemini 2.0.
* **Auto-Model Detection & Health Diagnostics**: Automatically query, test, and validate active LLM endpoints.

### 👥 3. Executive Administration & Governance (`/admin`)
* **Role-Based Access Control (RBAC)**: Manage Super Admin, Manager, Member, and Guest permissions.
* **Live Blocker Triage**: Surface team impediments and resolve operational bottlenecks.
* **Operations & Health Suite**: Live health ping diagnostic suite for PocketBase API and AI endpoints.
* **Workspace Analytics**: Real-time widget engine distributions, completion percentages, and productivity metrics.

### ☁️ 4. Hybrid Cloud & Offline Persistence
* **PocketBase SQLite Backend**: Real-time SSE subscriptions with optimistic client updates.
* **Cloud Config Sync**: AI preferences, profiles, and widget configurations sync automatically upon login.
* **Zero-Leakage Security Guardrails**: SSRF protection, loopback guardrails for Ollama, XSS-safe Markdown rendering, and automatic API key redaction in backup exports.

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/abhi340/OpenWork.git
cd OpenWork
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```

Configure your environment settings in `.env.local`:
```env
# PocketBase Database Endpoint (Cloud or Local)
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090

# Server-Side Default AI Keys (Optional Global Fallbacks)
NVIDIA_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
GEMINI_API_KEY=

# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Initialize PocketBase Database
If running a local PocketBase instance:
```bash
# Start PocketBase server (port 8090)
./pocketbase serve

# In a separate terminal, seed the required database schema
node pb_setup.mjs
```

### 5. Launch OpenWork
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Database & Realtime** | [PocketBase](https://pocketbase.io/) (SQLite WAL + Realtime SSE) |
| **Audio Engine** | Web Audio API Synthetic Synthesizer |

---

## 📜 License
This project is licensed under the MIT License.

