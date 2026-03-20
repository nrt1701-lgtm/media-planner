CREATE TABLE media_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL UNIQUE REFERENCES campaigns(id),
  audience_strategy JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  prepared_by TEXT,
  io_last_generated_at TIMESTAMPTZ,
  creative_specs_last_generated_at TIMESTAMPTZ,
  utm_sheet_last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
