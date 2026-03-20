CREATE TABLE ad_spec_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  placement TEXT NOT NULL,
  format_name TEXT NOT NULL,
  dimensions TEXT,
  file_types TEXT[] DEFAULT '{}',
  max_file_size TEXT,
  duration_limits TEXT,
  char_limits JSONB
);

-- Meta
INSERT INTO ad_spec_library (platform, placement, format_name, dimensions, file_types, max_file_size, duration_limits, char_limits) VALUES
  ('Meta', 'News Feed', 'Single Image', '1080x1080', '{JPG,PNG}', '30MB', NULL, '{"headline":40,"body":125,"description":30}'),
  ('Meta', 'News Feed', 'Single Video', '1080x1080', '{MP4,MOV}', '4GB', '1s-241min', '{"headline":40,"body":125,"description":30}'),
  ('Meta', 'News Feed', 'Carousel', '1080x1080', '{JPG,PNG,MP4}', '30MB', '1s-240min per card', '{"headline":40,"body":125,"description":20}'),
  ('Meta', 'Stories', 'Story Image', '1080x1920', '{JPG,PNG}', '30MB', NULL, '{"headline":40,"body":125}'),
  ('Meta', 'Stories', 'Story Video', '1080x1920', '{MP4,MOV}', '4GB', '1s-120s', '{"headline":40,"body":125}'),
  ('Meta', 'Reels', 'Reel Video', '1080x1920', '{MP4,MOV}', '4GB', '3s-90s', '{"headline":40,"body":72}');

-- Google
INSERT INTO ad_spec_library (platform, placement, format_name, dimensions, file_types, max_file_size, duration_limits, char_limits) VALUES
  ('Google', 'Display Network', 'Leaderboard', '728x90', '{JPG,PNG,GIF}', '150KB', NULL, NULL),
  ('Google', 'Display Network', 'Medium Rectangle', '300x250', '{JPG,PNG,GIF}', '150KB', NULL, NULL),
  ('Google', 'Display Network', 'Skyscraper', '160x600', '{JPG,PNG,GIF}', '150KB', NULL, NULL),
  ('Google', 'Display Network', 'Large Rectangle', '336x280', '{JPG,PNG,GIF}', '150KB', NULL, NULL),
  ('Google', 'Display Network', 'Mobile Banner', '320x50', '{JPG,PNG,GIF}', '150KB', NULL, NULL),
  ('Google', 'YouTube', 'Pre-Roll (Skippable)', '1920x1080', '{MP4}', '1GB', '12s-3min', NULL),
  ('Google', 'YouTube', 'Pre-Roll (Non-Skip)', '1920x1080', '{MP4}', '1GB', '15s or 20s', NULL),
  ('Google', 'YouTube', 'Bumper', '1920x1080', '{MP4}', '1GB', '6s max', NULL),
  ('Google', 'Search', 'Responsive Search', NULL, NULL, NULL, NULL, '{"headline":30,"description":90,"headlines_count":15,"descriptions_count":4}');

-- DV360 / TTD
INSERT INTO ad_spec_library (platform, placement, format_name, dimensions, file_types, max_file_size, duration_limits) VALUES
  ('DV360', 'Display', 'Standard Banner', '300x250', '{JPG,PNG,GIF,HTML5}', '200KB', NULL),
  ('DV360', 'Display', 'Leaderboard', '728x90', '{JPG,PNG,GIF,HTML5}', '200KB', NULL),
  ('DV360', 'Display', 'Half Page', '300x600', '{JPG,PNG,GIF,HTML5}', '200KB', NULL),
  ('DV360', 'Video', 'Standard Video', '1920x1080', '{MP4}', '1GB', '6s-60s'),
  ('DV360', 'Native', 'Native Display', '1200x627', '{JPG,PNG}', '1MB', NULL),
  ('TTD', 'Display', 'Standard Banner', '300x250', '{JPG,PNG,GIF,HTML5}', '200KB', NULL),
  ('TTD', 'Display', 'Leaderboard', '728x90', '{JPG,PNG,GIF,HTML5}', '200KB', NULL),
  ('TTD', 'Video', 'Standard Video', '1920x1080', '{MP4}', '1GB', '6s-60s');

-- Streaming / Audio
INSERT INTO ad_spec_library (platform, placement, format_name, dimensions, file_types, max_file_size, duration_limits) VALUES
  ('Hulu', 'Pre-Roll', 'Video Ad', '1920x1080', '{MP4}', '1GB', '15s or 30s'),
  ('Spotify', 'Audio', 'Audio Ad', NULL, '{MP3,WAV}', '500MB', '15s or 30s'),
  ('Spotify', 'Display', 'Companion Banner', '640x640', '{JPG,PNG}', '200KB', NULL);
