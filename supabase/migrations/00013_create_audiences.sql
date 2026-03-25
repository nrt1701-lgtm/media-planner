CREATE TABLE audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Audience',
  audience_strategy JSONB DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access" ON audiences
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
