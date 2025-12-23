const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(
      `INSERT INTO fields 
      (name, location, surface, lights, contact_email, contact_phone, open_time, close_time)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        data.name,
        data.location,
        data.surface,
        data.lights,
        data.contact_email,
        data.contact_phone,
        data.open_time,
        data.close_time
      ]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database error' })
    };
  } finally {
    await client.end();
  }
};
