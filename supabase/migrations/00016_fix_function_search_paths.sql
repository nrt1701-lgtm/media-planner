-- Fix: migration 00015 set search_path='' but the function bodies used unqualified
-- table references, breaking campaign creation (auto_create_media_plan trigger).
-- Recreate both affected functions with schema-qualified names.

CREATE OR REPLACE FUNCTION public.auto_create_media_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.media_plans (campaign_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_format_workamajig_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_client_code TEXT;
BEGIN
  IF NEW.expense_number IS NOT NULL AND NEW.client_id IS NOT NULL THEN
    SELECT client_code INTO v_client_code FROM public.clients WHERE id = NEW.client_id;
    IF v_client_code IS NOT NULL THEN
      NEW.workamajig_code := public.generate_workamajig_code(
        TO_CHAR(NEW.start_date, 'YY'),
        v_client_code,
        NEW.expense_number
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
