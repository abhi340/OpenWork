<div align="center">

# ⚡ OpenWork
### High-Velocity Modular Execution Cockpit & Personal Workplace OS

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1%20Edge%20SQL-f38020?style=flat&logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*A modern, customizable personal execution dashboard built for high-performance knowledge workers, featuring autonomous AI Copilot widget generation, Cloudflare D1 Serverless Edge SQL persistence, and zero-maintenance global deployment.*

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
* **Autonomous Widget Construction**: Build, clear, and modify customized widgets directly on your dashboard in 1 click using natural language commands.
* **Multi-Provider AI Architecture**:
  * **NVIDIA NIM Cloud**: Flagship models via high-speed API endpoints.
  * **Groq Cloud**: Ultra-low latency Llama-3.3-70B.
  * **OpenAI & Compatible Endpoints**: GPT-4o / GPT-4o-mini / Custom HTTPS proxies.
  * **Google Gemini**: Gemini 1.5 Flash / Gemini 2.0.
  * **Local Ollama**: 100% free, offline, and private AI execution (`llama3.2`, `deepseek-r1`, etc.).
* **Persistent Chat**: Conversations persist across page reloads.

### ☁️ 3. Cloudflare D1 Serverless Edge SQL Backend
* **Global Edge Execution**: Cloudflare Pages Functions (`/functions/api/*`) with sub-5ms cold starts across 300+ data centers.
* **Generous Scalability**: 5,000,000 free reads/day, 100,000 writes/day, and 10GB storage.
* **Optimistic Local Caching**: Instant UI responsiveness with automatic cloud background sync.

### 👥 4. Executive Administration & Governance (`/admin`)
* **Role-Based Access Control (RBAC)**: Manage Super Admin, Manager, Member, and Guest permissions.
* **Live Blocker Triage**: Surface team impediments and resolve operational bottlenecks.
* **Operations & Health Suite**: Live health ping diagnostic suite for Cloudflare D1 and AI endpoints.
* **Workspace Analytics**: Real-time widget engine distributions, completion percentages, and productivity metrics.

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

### 3. Launch Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Cloudflare Deployment

### 1. Initialize Cloudflare D1 Database
```bash
npx wrangler d1 create openwork-db
npx wrangler d1 execute openwork-db --file=./d1_schema.sql --remote
```

### 2. Deploy to Cloudflare Pages
```bash
npm run build
npx wrangler pages deploy out --project-name=openwork
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 16.3 (Turbopack, App Router, React 19) |
| **Language & Types** | TypeScript 5.0 Strict Mode |
| **Styling & UI** | Tailwind CSS v4 + Lucide Icons + Glassmorphism Tokens |
| **Database & Serverless** | Cloudflare D1 Edge SQL + Cloudflare Pages Functions |
| **State Management** | Zustand with Local Storage Cache & Optimistic Edge Sync |

---

## 📜 License
MIT License. Crafted for high-performance individual execution.
