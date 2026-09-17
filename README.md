<div align="center">

# ⚡ OpenWork
### High-Velocity Modular Execution Cockpit & Personal Workplace OS

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloudflare%20Workers-f38020?style=for-the-badge&logo=cloudflare)](https://openwork.abhicm019.workers.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1%20Edge%20SQL-f38020?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vulnerabilities](https://img.shields.io/badge/Vulnerabilities-0%20passed-brightgreen?style=for-the-badge)](https://github.com/abhi340/OpenWork)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

*A modern, customizable personal execution dashboard built for high-performance knowledge workers, featuring autonomous AI Copilot widget generation, Firebase Authentication & Cloud Firestore synchronization, Cloudflare D1 Serverless Edge SQL persistence, and zero-maintenance global deployment.*

**🌐 Live Application:** [https://openwork.abhicm019.workers.dev](https://openwork.abhicm019.workers.dev)

</div>

---

## 🌟 Key Features

### 🔐 1. Unified Authentication & Cloud Profile Sync
* **Multi-Provider Firebase Auth**:
  * **Google Sign-In**: 1-click popup authentication.
  * **Email & Password**: Instant registration and secure authentication.
  * **Phone Authentication**: SMS OTP verification via reCAPTCHA enterprise verifier.
* **Persistent Cloud Sync**:
  * User profile, avatar, workspace preferences, and AI configurations automatically persist to **Cloud Firestore** (`users/{uid}`) and browser `localStorage`.
  * **Zero Setup on Daily Login**: AI API keys, endpoints, and model selections are restored automatically every day.

---

### 🤖 2. Dual-Engine Universal AI Copilot
* **Local Ollama Engine (100% Free, Private & Offline)**:
  * Scans local Ollama installation across `127.0.0.1` and `localhost`.
  * Auto-detects installed models (e.g. `llama3.2:latest`, `deepseek-r1`, `qwen2.5`) with live connection status indicators.
  * **Automated Cloudflare HTTPS Tunnel Bridge**: 1-click script (`npm run tunnel`) automatically bridges local Ollama through Cloudflare Tunnels and syncs directly with the live Cloudflare deployment via D1 database routing.
  * Runs completely on your PC with zero API keys required and zero data leaving your machine.
* **Cloud AI Model Engine (Any Cloud Provider)**:
  * Simplified to **2 clean fields**: **API Key** and **Model Name**.
  * **Format Auto-Detection**: Instant provider recognition for:
    * **NVIDIA NIM** (`nvapi-...`) ➔ `meta/llama-3.2-11b-vision-instruct`, `llama-3.3-70b`
    * **Groq** (`gsk_...`) ➔ `llama-3.3-70b-versatile`
    * **Google Gemini** (`AIzaSy...`) ➔ `gemini-1.5-flash`
    * **OpenAI** (`sk-...`) ➔ `gpt-4o-mini`, `gpt-4o`, `o3-mini`
    * **OpenRouter** (`sk-or-...`) ➔ Any open-source or commercial model
  * **Seamless Cloud Fallback**: Automatically routes to Cloud AI if local Ollama is offline or unbridged.
* **Intelligent Conversation vs. Dashboard Architecting**:
  * Responds naturally to questions and general queries in clean markdown.
  * Autonomously generates, modifies, and removes widgets when instructed (e.g. *"build a focus timer for 25 minutes and a sprint checklist"*).
  * 100% test-verified parser with stress test suite (27/27 passed).

---

### 🎛️ 3. Modular Dynamic Widget System
* **Counter Batches**: Batch progress tracking with target caps, blocker logging, and celebration triggers.
* **Sprint Timers**: Integrated focus sessions with customizable intervals, audio chimes, and status indicators.
* **Smart Checklists**: Task hierarchies with subtask indentation, priority tags, and progress meters.
* **Data & Lead Tables**: Multi-column data grids with inline cell editing and status badges.
* **Kanban Execution Pipelines**: Customizable drag-and-drop workflow stages.
* **Metric KPIs & Milestones**: Numerical target metrics with step adjustments and deadline counters.
* **Daily Link Hub Dock**: Quick launchpad bookmarks for high-frequency tools.
* **Custom Block Studio**: AI-assisted visual widget designer to generate bespoke engines.

---

### 📋 4. Daily Executive Standup & AI Polish
* **Multi-Channel Export**: 1-click instant formatting for **Slack**, **Executive Leadership Email**, **Scrum Standup**, and **JSON Blueprint**.
* **AI Polish & Elevate**: Rewrite raw execution items into authoritative, high-impact executive summaries.
* **Clipboard Copy**: Formatted rich-text and markdown export.

---

### ⚡ 5. Routine Automation Engine (`/routines`)
* **Scheduled Workflow Blueprints**: Pre-configure recurring daily, weekly, or sprint routine packs.
* **1-Click Batch Activation**: Populate whole dashboards with predefined counters, timers, and pipelines in a single click.

---

### 👥 6. Executive Administration & Governance (`/admin`)
* **Role-Based Access Control (RBAC)**: Manage Super Admin, Manager, Member, and Guest permissions.
* **Live Blocker Triage**: Surface team impediments and resolve operational bottlenecks.
* **Operations & Health Suite**: Live health ping diagnostic suite for Cloudflare D1 and AI endpoints.
* **Workspace Analytics**: Real-time widget engine distributions and productivity metrics.

---

## 🛡️ Security & Defensive Architecture

* **SSRF Protection**: All edge endpoints validate destination URLs and explicitly block private network access, cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`), and loopback IPs from remote calls.
* **SQL Injection Prevention**: All Cloudflare D1 Edge SQL queries use strict parameterized bindings (`stmt.bind(...)`).
* **Zero Secrets in Code**: No API keys, credentials, or secrets stored in repository or committed to git.
* **Anti-CSRF Protection**: Stateful double-submit cookie validation for data mutation endpoints.
* **Hardened Security Headers**:
  * `X-Frame-Options: DENY`
  * `X-Content-Type-Options: nosniff`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  * `Permissions-Policy: camera=(), microphone=(), geolocation=()`
* **Dependency Auditing**: 0 high or critical vulnerabilities (`npm audit` verified clean).

---

## 🤖 AI Setup Guide

### Option A: Local Ollama (100% Free & Private)

1. **Install Ollama** on your machine:
   * Download from [ollama.com](https://ollama.com).
2. **Download a Model**:
   ```bash
   ollama run llama3.2
   ```
3. **Using on Localhost (`http://localhost:3000`)**:
   * Open Settings ➔ Select **Local Ollama** ➔ Click **Scan Installed Models**.
   * It will instantly connect directly to `http://127.0.0.1:11434`.
4. **Using on Live Cloudflare (`https://openwork.abhicm019.workers.dev`)**:
   * Because browsers block HTTPS pages from calling insecure local HTTP, use the built-in 1-click bridge:
     ```bash
     npm run tunnel
     ```
     *(Or double-click `scripts/start-ollama-bridge.bat` on Windows)*
   * The bridge automatically generates a secure Cloudflare Tunnel, updates your D1 database, and connects your local Ollama seamlessly to the live site.

---

### Option B: Cloud AI (Zero Local Setup)

Open **Settings** ➔ Select **Cloud AI** and paste any API key:

| Provider | Key Prefix | Default Model | Get Key |
|---|---|---|---|
| **NVIDIA NIM** | `nvapi-...` | `meta/llama-3.2-11b-vision-instruct` | [build.nvidia.com](https://build.nvidia.com) |
| **Groq** | `gsk_...` | `llama-3.3-70b-versatile` | [console.groq.com](https://console.groq.com) |
| **Google Gemini** | `AIzaSy...` | `gemini-1.5-flash` | [aistudio.google.com](https://aistudio.google.com) |
| **OpenAI** | `sk-...` | `gpt-4o-mini` | [platform.openai.com](https://platform.openai.com) |
| **OpenRouter** | `sk-or-...` | `deepseek/deepseek-r1` | [openrouter.ai](https://openrouter.ai) |

*Click **Save Configuration** (or **Test Connection**) and the AI Copilot is immediately active.*

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | Next.js 16.3 + React 19 | App Router, Turbopack, Static Export Optimization |
| **Type Safety** | TypeScript 5.0 | Strict Mode throughout codebase |
| **Styling & UI** | Tailwind CSS v4 + Lucide Icons | Glassmorphism design system & Dark/Light theme |
| **Authentication & Profile** | Firebase Auth + Firestore | Google OAuth, Email/Password, Phone OTP, Cloud Sync |
| **Database & Serverless** | Cloudflare D1 Edge SQL + Workers | Global edge execution across 300+ data centers |
| **AI Integration** | Universal AI Client (`src/lib/ai.ts`) | Ollama, NVIDIA NIM, Groq, Gemini, OpenRouter, OpenAI |
| **State Management** | Zustand + LocalStorage Cache | Instant optimistic UI updates with cloud sync |

---

## 🚀 Quick Start & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/abhi340/OpenWork.git
cd OpenWork
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables (Optional for Firebase Auth)
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Launch Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Cloudflare Workers Deployment

### 1. Initialize Cloudflare D1 Database (Optional for Edge SQL)
```bash
npx wrangler d1 create openwork-db
npx wrangler d1 execute openwork-db --file=./d1_schema.sql --remote
```

### 2. Build & Deploy
```bash
npm run build
npx wrangler deploy
```

---

## 🧪 Testing

Run the automated AI parser and widget generation precision test suite:
```bash
npx tsx scripts/test-ai-precision.ts
```
*Expected output: 27/27 Passed (100% Accuracy).*

---

## 📜 License
MIT License. Crafted for high-performance individual and team execution.
