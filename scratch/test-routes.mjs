const routes = [
  '/',
  '/scan',
  '/history',
  '/sessions',
  '/settings',
  '/manifest.webmanifest',
  '/sw.js',
];

async function checkRoutes() {
  console.log('Testing live server routes on http://localhost:3000 ...');
  let allOk = true;

  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3000${r}`);
      console.log(`[HTTP ${res.status}] ${r} (${res.headers.get('content-type') || 'unknown'})`);
      if (res.status !== 200) {
        allOk = false;
      }
    } catch (err) {
      console.error(`[ERROR] ${r}:`, err.message);
      allOk = false;
    }
  }

  if (allOk) {
    console.log('\n✅ ALL ROUTES RETURNED HTTP 200 OK');
    process.exit(0);
  } else {
    console.error('\n❌ SOME ROUTES FAILED');
    process.exit(1);
  }
}

checkRoutes();
