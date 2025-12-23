const { Client } = require('pg');

// Returns upcoming registrations from the DB
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
    // Return upcoming registrations (today and future)
  const q = `SELECT id, name, email, scheduled_date, to_char(scheduled_time, 'HH24:MI') as scheduled_time, field_name, status FROM registrations WHERE scheduled_date >= CURRENT_DATE ORDER BY scheduled_date ASC, scheduled_time ASC LIMIT 200`;
    const res = await client.query(q);
    await client.end();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrations: res.rows })
    };
  } catch (err) {
    console.error('get-registrations error', err);
    try { await client.end(); } catch(e){}
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
