const { Client } = require('pg');

exports.handler = async function(event) {
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL not configured' }) };
  }

  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
  // Include working hours so the client can display availability windows
  const q = `SELECT id, name, location, surface, lights, contact_email, contact_phone, open_time, close_time FROM fields ORDER BY name ASC LIMIT 100`;
    const res = await client.query(q);
    await client.end();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: res.rows })
    };
  } catch (err) {
    console.error('get-fields error', err);
    try { await client.end(); } catch(e){}
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
