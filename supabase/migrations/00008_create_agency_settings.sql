CREATE TABLE agency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name TEXT NOT NULL DEFAULT '',
  agency_logo_url TEXT,
  io_terms_template TEXT NOT NULL DEFAULT 'Standard terms and conditions apply.',
  creative_lead_time_days INTEGER NOT NULL DEFAULT 10,
  default_utm_template_id UUID REFERENCES utm_templates(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO agency_settings (agency_name) VALUES ('');
