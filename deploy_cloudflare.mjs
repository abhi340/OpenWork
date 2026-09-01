#!/usr/bin/env node
import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

console.log(`
=====================================================
⚡ OpenWork Cloudflare Pages & D1 Edge Setup
Account: abhicm019@gmail.com
=====================================================
`);

async function run() {
  try {
    console.log("Step 1: Logging into Cloudflare CLI (Wrangler)...");
    console.log("Please authenticate your Cloudflare account in the browser window.\n");
    
    try {
      execSync('npx wrangler login', { stdio: 'inherit' });
    } catch (e) {
      console.log("Wrangler login step complete or skipped.");
    }

    console.log("\nStep 2: Creating Cloudflare D1 Database 'openwork-db'...");
    let output = "";
    try {
      output = execSync('npx wrangler d1 create openwork-db', { encoding: 'utf8' });
      console.log(output);
    } catch (e) {
      console.log("Note: Database 'openwork-db' may already exist. Proceeding...");
    }

    console.log("\nStep 3: Applying Database Schema (d1_schema.sql)...");
    try {
      execSync('npx wrangler d1 execute openwork-db --file=./d1_schema.sql --remote', { stdio: 'inherit' });
      console.log("✅ Database schema successfully deployed to Cloudflare D1 Edge!");
    } catch (e) {
      console.log("Trying local execution...");
      execSync('npx wrangler d1 execute openwork-db --file=./d1_schema.sql --local', { stdio: 'inherit' });
      console.log("✅ Local D1 database initialized.");
    }

    console.log(`
=====================================================
🎉 Cloudflare D1 Setup Complete!
To deploy your Next.js application to Cloudflare Pages:
  1. npm run build
  2. npx wrangler pages deploy .next
=====================================================
`);
  } catch (err) {
    console.error("Setup error:", err.message);
  } finally {
    rl.close();
  }
}

run();
