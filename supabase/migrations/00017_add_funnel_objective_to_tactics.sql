ALTER TABLE tactics
  ADD COLUMN funnel_stage TEXT CHECK (funnel_stage IN ('Awareness', 'Consideration', 'Conversion')),
  ADD COLUMN objective TEXT;
