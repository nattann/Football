-- SQL schema for registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  field_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  paid_amount BIGINT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table to store registered fields (added so register-field submissions can be persisted)
CREATE TABLE IF NOT EXISTS fields (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  surface TEXT,
  lights BOOLEAN DEFAULT false,
  contact_email TEXT,
  contact_phone TEXT,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);
