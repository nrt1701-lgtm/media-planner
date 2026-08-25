CREATE TABLE platform_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  month DATE NOT NULL,
  actual_spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform, month)
);

CREATE INDEX idx_platform_actuals_client_id ON platform_actuals(client_id);

ALTER TABLE platform_actuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access" ON platform_actuals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_platform_actuals_updated_at
  BEFORE UPDATE ON platform_actuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
