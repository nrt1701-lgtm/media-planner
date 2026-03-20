CREATE OR REPLACE FUNCTION generate_workamajig_code(
  p_year TEXT,
  p_client_code TEXT,
  p_expense_number TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN p_year || '-' || UPPER(p_client_code) || '-' || LPAD(p_expense_number, 4, '0');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
