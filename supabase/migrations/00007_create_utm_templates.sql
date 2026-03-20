CREATE TABLE utm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL DEFAULT 'Default',
  source_pattern TEXT NOT NULL DEFAULT '{platform}',
  medium_pattern TEXT NOT NULL DEFAULT '{channel_slug}',
  campaign_pattern TEXT NOT NULL DEFAULT '{workamajig_code}_{campaign_slug}',
  content_pattern TEXT NOT NULL DEFAULT '{format}_{placement_slug}',
  term_pattern TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO utm_templates (client_id, name, source_pattern, medium_pattern, campaign_pattern, content_pattern)
VALUES (NULL, 'Global Default', '{platform}', '{channel_slug}', '{workamajig_code}_{campaign_slug}', '{format}_{placement_slug}');
