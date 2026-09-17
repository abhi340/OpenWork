// scripts/ollama-tunnel.mjs
// Auto-discovers Ollama, starts a Cloudflare Quick Tunnel, and registers the HTTPS URL with OpenWork

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const tunnelFile = path.join(rootDir, ".tunnel_url");

// Find cloudflared executable
const possiblePaths = [
  "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
  "C:\\Program Files\\cloudflared\\cloudflared.exe",
  process.env.LOCALAPPDATA + "\\Programs\\cloudflared\\cloudflared.exe",
  "cloudflared.exe",
  "cloudflared"
];

let cloudflaredBin = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    cloudflaredBin = p;
    break;
  }
}

if (!cloudflaredBin) {
  cloudflaredBin = "cloudflared"; // Hope it is in PATH
}

console.log("==================================================");
console.log(" OpenWork Ollama Cloudflare Tunnel Auto-Bridge");
console.log("==================================================");
console.log(`[1/3] Using binary: ${cloudflaredBin}`);

// 1. Verify Ollama is reachable
async function checkOllama() {
  try {
    const res = await fetch("http://127.0.0.1:11434/api/tags");
    if (res.ok) {
      const data = await res.json();
      console.log(`[2/3] Local Ollama verified online with ${data.models?.length || 0} installed models.`);
      return true;
    }
  } catch (e) {
    console.warn("[!] Warning: Local Ollama on 127.0.0.1:11434 is not responding yet. Attempting to start tunnel anyway...");
  }
  return false;
}

// 2. Register Tunnel URL with OpenWork endpoints
async function registerTunnelUrl(tunnelUrl) {
  console.log(`\n>>> ACTIVE TUNNEL URL: ${tunnelUrl}\n`);
  fs.writeFileSync(tunnelFile, tunnelUrl.trim(), "utf-8");

  const endpoints = [
    "https://openwork.abhicm019.workers.dev/api/ai/tunnel",
    "http://localhost:3000/api/ai/tunnel"
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tunnelUrl })
      });
      if (res.ok) {
        console.log(`[SYNC SUCCESS] Registered tunnel with ${ep}`);
      }
    } catch (e) {
      // Quietly ignore if dev server is not running
    }
  }
}

// 3. Start Cloudflare Tunnel
await checkOllama();
console.log("[3/3] Launching Cloudflare Tunnel on http://127.0.0.1:11434...");

const tunnelProc = spawn(cloudflaredBin, ["tunnel", "--url", "http://127.0.0.1:11434"], {
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true
});

let activeUrl = "";

function handleLog(data) {
  const text = data.toString();
  const match = text.match(/(https:\/\/[a-z0-9\-]+\.trycloudflare\.com)/i);
  if (match && match[1] && !activeUrl) {
    activeUrl = match[1];
    registerTunnelUrl(activeUrl);
  }
}

tunnelProc.stdout.on("data", handleLog);
tunnelProc.stderr.on("data", handleLog);

tunnelProc.on("close", (code) => {
  console.log(`Tunnel process exited with code ${code}`);
  if (fs.existsSync(tunnelFile)) {
    fs.unlinkSync(tunnelFile);
  }
  process.exit(code || 0);
});

// Heartbeat every 60 seconds to keep registration fresh
setInterval(() => {
  if (activeUrl) {
    registerTunnelUrl(activeUrl);
  }
}, 60000);
