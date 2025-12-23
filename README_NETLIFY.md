Setup notes — Netlify + Neon + Stripe + SendGrid

Overview
- This project adds a registration flow that creates a Stripe Checkout session and uses Netlify Functions to handle server-side logic.
- When a user registers and pays, a webhook finalizes the registration in Neon (Postgres) and sends a single confirmation email via SendGrid.

Required environment variables (set these in Netlify dashboard -> Site settings -> Build & deploy -> Environment)
- DATABASE_URL : Neon/Postgres connection string (include user/pass). Example: postgres://user:pass@host:5432/dbname
- STRIPE_SECRET : Your Stripe secret key (sk_live_...)
- STRIPE_WEBHOOK_SECRET : Stripe webhook signing secret for the webhook endpoint
- SENDGRID_API_KEY : SendGrid API key used for sending confirmation emails
- EMAIL_FROM : Optional, email address used as sender for confirmation emails (defaults to no-reply@your-site.example)
- SITE_URL : Public site URL (used for success/cancel URLs), e.g. https://your-site.netlify.app

Files added
- netlify/functions/create-checkout.js : Creates a registration record and a Stripe Checkout Session. Returns session.url to frontend.
- netlify/functions/webhook.js : Receives Stripe webhook events, marks registration as paid, and sends confirmation email via SendGrid.
- main/schedule.html : Contains the booking form wired to call the create-checkout function.
- main/schedule.css : Page-specific styles for the schedule page.
- main/db/schema.sql : SQL schema to create the registrations table.
- package.json : Declares function dependencies (stripe, pg, @sendgrid/mail).

How it works
1. User fills the booking form on /main/schedule.html and clicks "Pay & Register".
2. Frontend POSTs to `/.netlify/functions/create-checkout` with name, email, date, time and an amount in cents.
3. The function inserts a pending registration in the Neon DB and creates a Stripe Checkout Session with the registration id in metadata. It returns the Checkout URL.
4. The frontend redirects the user to Stripe Checkout to pay.
5. After payment, Stripe triggers a `checkout.session.completed` webhook to the Netlify function `/.netlify/functions/webhook`.
6. The webhook verifies the signature, updates the registration in DB to `paid`, and sends a single confirmation email (receipt + booking details) via SendGrid.

Notes & next steps
- You must create the `registrations` table in your Neon DB using `main/db/schema.sql` before processing payments.
- Deploy to Netlify so that functions run on the Netlify platform and environment variables are available.
- To configure the Stripe webhook, set the endpoint URL to `https://<your-site>.netlify.app/.netlify/functions/webhook` and capture the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
- For testing locally, use Stripe CLI to forward webhooks and set local env vars.

Security
- Do NOT commit secrets. Use Netlify environment variables.
- Use HTTPS for SITE_URL.

If you'd like, I can:
- Add a serverless endpoint to list registrations (admin only).
- Add anti-spam measures (reCAPTCHA) on the form.
- Add a success page after checkout that displays the session info.
- Walk through deploying this to Netlify and adding the required environment variables.
