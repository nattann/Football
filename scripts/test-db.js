const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL. Set it and run again. Example (PowerShell):');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT now() as now');
    console.log('Connected OK, server time:', res.rows[0].now);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message || err);
    try { await client.end(); } catch(e){}
    process.exit(2);
  }
})();
