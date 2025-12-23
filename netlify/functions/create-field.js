const { Client } = require('pg');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL not configured' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, location, surface, lights, contact_email, contact_phone, open_time, close_time } = body;
    if (!name || !contact_email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: name or contact_email' }) };
    }

    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();

    // Insert or update if the field name already exists. Include optional working hours.
    const insert = `INSERT INTO fields(name, location, surface, lights, contact_email, contact_phone, open_time, close_time) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (name) DO UPDATE SET location=EXCLUDED.location, surface=EXCLUDED.surface, lights=EXCLUDED.lights, contact_email=EXCLUDED.contact_email, contact_phone=EXCLUDED.contact_phone, open_time=EXCLUDED.open_time, close_time=EXCLUDED.close_time RETURNING id`;
    const values = [
      name,
      location || null,
      surface || null,
      lights ? true : false,
      contact_email,
      contact_phone || null,
      open_time && open_time.length ? open_time : null,
      close_time && close_time.length ? close_time : null
    ];
    const res = await client.query(insert, values);
    await client.end();

    return { statusCode: 200, body: JSON.stringify({ ok: true, id: res.rows[0].id }) };
  } catch (err) {
    console.error('create-field error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
