const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

exports.handler = async function(event) {
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.DATABASE_URL) {
    console.error('get-fields: DATABASE_URL not configured');
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL not configured' }) };
  }

  try {
    // Include working hours so the client can display availability windows
    const q = `SELECT id, name, location, surface, lights, contact_email, contact_phone, open_time, close_time FROM fields ORDER BY name ASC LIMIT 100`;
    const rows = await sql`${q}`;
    // neon returns an array of rows
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: rows || [] })
    };
  } catch (err) {
    console.error('get-fields error', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Database error' }) };
  }
};
