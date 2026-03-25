-- Performance: index FK columns flagged by Supabase performance lints
CREATE INDEX IF NOT EXISTS idx_audiences_campaign_id ON audiences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tactics_audience_id ON tactics(audience_id);

-- Security: fix mutable search_path on existing DB functions
ALTER FUNCTION public.update_updated_at() SET search_path = '';
ALTER FUNCTION public.auto_create_media_plan() SET search_path = '';
ALTER FUNCTION public.auto_format_workamajig_code() SET search_path = '';
ALTER FUNCTION public.generate_workamajig_code() SET search_path = '';
