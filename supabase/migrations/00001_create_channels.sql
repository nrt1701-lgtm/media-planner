CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO channels (name, color, sort_order) VALUES
  ('Programmatic Display', '#4F46E5', 1),
  ('Paid Social', '#2563EB', 2),
  ('Paid Search', '#16A34A', 3),
  ('Video/OTT', '#DC2626', 4),
  ('Native', '#CA8A04', 5),
  ('Audio/Podcast', '#9333EA', 6),
  ('Linear TV', '#0891B2', 7),
  ('Radio', '#EA580C', 8),
  ('Print', '#64748B', 9),
  ('OOH', '#BE185D', 10);
