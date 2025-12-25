const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.DATABASE_URL) {
    console.error('create-field: DATABASE_URL not configured');
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL not configured' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Normalize inputs
  const rawName = data.name;
  const rawLocation = data.location;
  const rawSurface = data.surface;
  const rawLights = data.lights;
  const rawContactEmail = data.contact_email;
  const rawContactPhone = data.contact_phone;
  const rawOpenTime = data.open_time;
  const rawCloseTime = data.close_time;

  const name = typeof rawName === 'string' ? rawName.trim() : rawName;
  const location = typeof rawLocation === 'string' ? rawLocation.trim() : rawLocation;
  const surface = typeof rawSurface === 'string' ? rawSurface.trim() : rawSurface;
  const lights = typeof rawLights === 'boolean' ? rawLights : (rawLights === 'true' || rawLights === 1 || rawLights === '1');
  const contact_email = typeof rawContactEmail === 'string' ? rawContactEmail.trim() : rawContactEmail;
  const contact_phone = typeof rawContactPhone === 'string' ? rawContactPhone.trim() : rawContactPhone;
  const open_time = rawOpenTime ?? null;
  const close_time = rawCloseTime ?? null;

  // Required fields
  const missing = [];
  if (!name) missing.push('name');
  if (!location) missing.push('location');
  if (!contact_email) missing.push('contact_email');

  if (missing.length) {
    return { statusCode: 400, body: JSON.stringify({ error: `Missing required fields: ${missing.join(', ')}` }) };
  }

  // Basic email validation
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(contact_email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid contact_email format' }) };
  }

  try {
    // Insert using Neon serverless client
    const result = await sql`
      INSERT INTO fields
        (name, location, surface, lights, contact_email, contact_phone, open_time, close_time)
      VALUES
        (${name}, ${location}, ${surface ?? null}, ${lights ?? false}, ${contact_email}, ${contact_phone ?? null}, ${open_time}, ${close_time})
      RETURNING id
    `;

    // neon client returns an array of rows
    const insertedId = result && result[0] && result[0].id ? result[0].id : null;

    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, id: insertedId })
    };
  } catch (err) {
    console.error('create-field error', err);

    // Postgres duplicate key error code
    // (23505 is unique_violation)
    if (err && (err.code === '23505' || (err.constraint && /name/i.test(err.constraint)) || (err.message && /duplicate/i.test(err.message)))) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Field name already exists' }) };
    }

    return { statusCode: 500, body: JSON.stringify({ error: 'Database error' }) };
  }
};
