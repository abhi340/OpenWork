<div align="center">

# ⚡ OpenWork
### High-Velocity Modular Execution Cockpit & Personal Workplace OS

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloudflare%20Workers-f38020?style=for-the-badge&logo=cloudflare)](https://openwork.abhicm019.workers.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1%20Edge%20SQL-f38020?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
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
  * **Zero Setup on Daily Login**: AI API keys and model selections are restored automatically every day.

---

### 🤖 2. Streamlined AI Copilot Engine
* **2-Mode Universal AI Selector**:
  * **Local Ollama (100% Free & Private)**:
    * Scans local Ollama installation across `127.0.0.1` and `localhost`.
    * Auto-detects installed models (e.g. `llama3.2:latest`, `deepseek-r1`, `qwen2.5`) with live connection status indicators.
    * Executes locally on your machine with zero API keys required and zero data leaving your computer.
  * **Cloud AI Model (Any API Key & Provider)**:
    * Simplified to **2 clean fields**: **API Key** and **Model Name**.
    * **Auto-Detection**: Recognizes Groq (`gsk_...`), NVIDIA NIM (`nvapi-...`), Google Gemini (`AIzaSy...`), OpenRouter (`sk-or-...`), and OpenAI (`sk-...`).
    * **Live Model Population**: Auto-populates available models into a dropdown and provides 1-click suggestion chips.
* **CORS-Resilient Edge Gateway**:
  * Serverless proxy (`/api/ai/chat`) running on Cloudflare Workers edge, eliminating all browser CORS and preflight restrictions.
* **Intelligent Conversation vs. Dashboard Architecting**:
  * Responds naturally to casual queries and jokes in clean markdown.
  * Autonomously generates, edits, and removes widgets when instructed (e.g. *"build 3 sprint tasks for meeting at 4pm"*).
  * Sanitizes all internal tags so raw syntax never leaks into chat bubbles.

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

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | Next.js 16.3 + React 19 | App Router, Turbopack, Static Export Optimization |
| **Type Safety** | TypeScript 5.0 | Strict Mode throughout codebase |
| **Styling & UI** | Tailwind CSS v4 + Lucide Icons | Glassmorphism design system & Dark/Light theme |
| **Authentication & Profile** | Firebase Auth + Firestore | Google OAuth, Email/Password, Phone OTP, Cloud Sync |
| **Database & Serverless** | Cloudflare D1 Edge SQL + Workers | Global edge execution across 300+ data centers |
| **AI Integration** | Universal AI Client (`src/lib/ai.ts`) | Ollama, Groq, NVIDIA NIM, Google Gemini, OpenRouter, OpenAI |
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

### 3. Configure Environment Variables
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

## 📜 License
MIT License. Crafted for high-performance individual and team execution.
