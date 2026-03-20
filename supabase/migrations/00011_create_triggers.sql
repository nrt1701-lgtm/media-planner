-- Auto-create media_plan when campaign is inserted
CREATE OR REPLACE FUNCTION auto_create_media_plan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO media_plans (campaign_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_create_media_plan
  AFTER INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_media_plan();

-- Auto-format workamajig_code on campaign insert/update
CREATE OR REPLACE FUNCTION auto_format_workamajig_code()
RETURNS TRIGGER AS $$
DECLARE
  v_client_code TEXT;
BEGIN
  IF NEW.expense_number IS NOT NULL AND NEW.client_id IS NOT NULL THEN
    SELECT client_code INTO v_client_code FROM clients WHERE id = NEW.client_id;
    IF v_client_code IS NOT NULL THEN
      NEW.workamajig_code := generate_workamajig_code(
        TO_CHAR(NEW.start_date, 'YY'),
        v_client_code,
        NEW.expense_number
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_format_workamajig
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION auto_format_workamajig_code();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_media_plans_updated_at BEFORE UPDATE ON media_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tactics_updated_at BEFORE UPDATE ON tactics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
