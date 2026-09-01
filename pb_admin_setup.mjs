import PocketBase from 'pocketbase';
import readline from 'readline';

const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(pbUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔐 OpenWork — PocketBase Owner & Admin Setup');
  console.log(`Connecting to: ${pbUrl}`);
  console.log('═══════════════════════════════════════════════════════\n');

  const email = await question('Enter your Actual Admin Email (e.g. abhiramkodicherla@gmail.com): ');
  if (!email.trim() || !email.includes('@')) {
    console.error('❌ Please enter a valid email address.');
    rl.close();
    return;
  }

  const password = await question('Enter Admin Password (min 10 characters): ');
  if (!password || password.length < 10) {
    console.error('❌ Password must be at least 10 characters long.');
    rl.close();
    return;
  }

  const name = await question('Enter your Full Name (e.g. Abhiram Kodicherla): ');

  console.log('\nCreating/Updating Super Admin account in PocketBase...');

  try {
    // 1. Create Super Admin record in PocketBase
    const adminRes = await fetch(`${pbUrl}/api/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password, passwordConfirm: password })
    });

    const adminData = await adminRes.json();
    if (adminRes.ok) {
      console.log(`✅ Super Admin created successfully: ${email.trim()}`);
    } else {
      console.log(`ℹ️ Super Admin notice: ${adminData.message || 'Admin already initialized'}`);
    }

    // 2. Create User Workspace record in 'users' collection
    try {
      const userRes = await pb.collection('users').create({
        email: email.trim(),
        password,
        passwordConfirm: password,
        name: name.trim() || 'Abhiram Kodicherla',
        role: 'admin',
        workspaceName: 'Primary Executive Workspace'
      });
      console.log(`✅ User Workspace Account created: ${userRes.email} (Role: Super Admin)`);
    } catch (userErr) {
      console.log(`ℹ️ User collection notice: ${userErr.message || 'User already exists'}`);
    }

    console.log('\n🎉 Setup Complete!');
    console.log(`- PocketBase Admin Panel: ${pbUrl}/_/`);
    console.log(`- OpenWork Login: http://localhost:3000/login`);
    console.log(`- Log in with: ${email.trim()}`);
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    rl.close();
  }
}

main();
