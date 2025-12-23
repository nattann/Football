const { Client } = require('pg');
const Stripe = require('stripe');
const sgMail = require('@sendgrid/mail');

const stripe = Stripe(process.env.STRIPE_SECRET);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // set in Netlify
const DATABASE_URL = process.env.DATABASE_URL;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async function(event) {
  // Stripe sends POST requests with raw body; Netlify provides it as event.body
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'] || '';
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // We only handle checkout.session.completed
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    const registrationId = session.metadata && session.metadata.registration_id;
    const customerEmail = session.customer_email;
    const paymentIntent = session.payment_intent;

    // Update DB and send confirmation email
    try {
      const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await client.connect();

      // Update registration
      await client.query('UPDATE registrations SET status=$1, paid_amount=$2, paid_at=NOW(), stripe_payment_intent=$3 WHERE id=$4', ['paid', session.amount_total || 0, paymentIntent, registrationId]);

      // Retrieve registration details to include in email
      const r = await client.query('SELECT name, email, scheduled_date, scheduled_time FROM registrations WHERE id=$1', [registrationId]);
      const reg = r.rows[0];

      const msg = {
        to: reg.email,
        from: process.env.EMAIL_FROM || 'no-reply@your-site.example',
        subject: 'Booking confirmation',
        text: `Hi ${reg.name},\n\nYour booking for ${reg.scheduled_date} at ${reg.scheduled_time} is confirmed. Payment received.\n\nThank you!`,
        html: `<p>Hi ${reg.name},</p><p>Your booking for <strong>${reg.scheduled_date} at ${reg.scheduled_time}</strong> is confirmed. Payment received.</p><p>Receipt: <a href="https://dashboard.stripe.com/payments/${paymentIntent}">View payment</a></p><p>Thanks!</p>`,
      };

      await sgMail.send(msg);

      await client.end();
    } catch (err) {
      console.error('Error updating DB or sending email:', err);
      // Still return 200 to Stripe to avoid retries if appropriate, or return 500 to retry.
      return { statusCode: 500, body: `Webhook handling error: ${err.message}` };
    }
  }

  return { statusCode: 200, body: 'Received' };
};
