import PocketBase from 'pocketbase';

const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(pbUrl);

async function setup() {
  const email = process.env.PB_ADMIN_EMAIL || 'admin@openwork.local';
  const password = process.env.PB_ADMIN_PASSWORD;

  if (!password) {
    console.warn('\n[SECURITY WARNING] PB_ADMIN_PASSWORD environment variable not set.');
    console.warn('[SECURITY WARNING] Using fallback development password. DO NOT use this in production!\n');
  }

  const activePassword = password || 'OpenWorkDevPass_ChangeMeImmediately!';

  console.log(`Connecting to PocketBase at ${pbUrl}...`);

  let token = '';
  try {
    const res = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password: activePassword })
    });
    const authData = await res.json();
    token = authData.token;
  } catch (e) {
    console.log('Admin auth error:', e.message);
  }

  const collections = [
    {
      name: 'daily_blocks',
      type: 'base',
      schema: [
        { name: 'date', type: 'text', required: false },
        { name: 'title', type: 'text', required: true },
        { name: 'block_type', type: 'text', required: true },
        { name: 'config', type: 'json', required: false, options: { maxSize: 2000000 } },
        { name: 'items', type: 'json', required: false, options: { maxSize: 2000000 } },
        { name: 'order_index', type: 'number', required: false }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    },
    {
      name: 'routine_templates',
      type: 'base',
      schema: [
        { name: 'title', type: 'text', required: true },
        { name: 'structure', type: 'json', required: true, options: { maxSize: 2000000 } }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    },
    {
      name: 'documents',
      type: 'base',
      schema: [
        { name: 'block_id', type: 'text', required: false },
        { name: 'title', type: 'text', required: false },
        { name: 'content', type: 'json', required: false, options: { maxSize: 5000000 } }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    },
    {
      name: 'workspaces',
      type: 'base',
      schema: [
        { name: 'name', type: 'text', required: true },
        { name: 'branding', type: 'json', required: false, options: { maxSize: 2000000 } }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    }
  ];

  for (const col of collections) {
    try {
      const res = await fetch(`${pbUrl}/api/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': token } : {})
        },
        body: JSON.stringify(col)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✓ Collection created: ${col.name}`);
      } else {
        console.log(`- Collection notice (${col.name}):`, data.message);
      }
    } catch (err) {
      console.error(`Error with collection ${col.name}:`, err.message);
    }
  }

  console.log('\n🚀 Database tables setup completed!');
}

setup().catch(console.error);
