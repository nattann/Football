const { Client } = require('pg');
const Stripe = require('stripe');

// Keep functions idempotent and short-lived. Use environment variables in Netlify dashboard.
const stripe = Stripe(process.env.STRIPE_SECRET);
const DATABASE_URL = process.env.DATABASE_URL; // Neon connection string

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!DATABASE_URL) {
    console.error('create-checkout: DATABASE_URL not configured');
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL not configured' }) };
  }
  try {
    const body = JSON.parse(event.body);
    const { name, email, date, time, price_cents, field } = body;
    if (!name || !email || !date || !time) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // Connect to DB and insert a pending registration
    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();

      // include chosen field_name if provided
      const insertText = `INSERT INTO registrations(name, email, scheduled_date, scheduled_time, field_name, status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`;
      const insertValues = [name, email, date, time, field || null, 'pending'];
      const res = await client.query(insertText, insertValues);
      const registrationId = res.rows[0].id;

      // Create a Stripe Checkout Session
      // price_cents is optional; default to 1000 (i.e., $10.00)
      const amount = Number.isInteger(price_cents) ? price_cents : 1000;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: `Booking for ${date} ${time}` },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        metadata: {
          registration_id: String(registrationId),
          field: field || ''
        },
        success_url: `${process.env.SITE_URL || 'https://your-site.example'}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_URL || 'https://your-site.example'}/main/schedule.html`,
      });

      // Save stripe session id in DB
      await client.query('UPDATE registrations SET stripe_session_id=$1 WHERE id=$2', [session.id, registrationId]);

      await client.end();

      return {
        statusCode: 200,
        body: JSON.stringify({ url: session.url }),
      };
    } catch (dbErr) {
      console.error('create-checkout DB error', dbErr);
      try { await client.end(); } catch(e){}
      return { statusCode: 500, body: JSON.stringify({ error: dbErr.message }) };
    }
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
