CREATE TABLE tactics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES media_plans(id),
  name TEXT NOT NULL DEFAULT '',
  channel TEXT,
  platform TEXT,
  placement TEXT,
  ad_spec_ids UUID[] DEFAULT '{}',
  flight_start DATE,
  flight_end DATE,
  budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_type TEXT DEFAULT 'CPM',
  rate NUMERIC(12,4) DEFAULT 0,
  est_impressions BIGINT,
  landing_page_url TEXT,
  audience_notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tactics_plan_id ON tactics(plan_id);
