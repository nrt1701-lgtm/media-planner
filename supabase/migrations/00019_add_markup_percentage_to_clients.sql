ALTER TABLE clients
  ADD COLUMN markup_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (markup_percentage >= 0);
