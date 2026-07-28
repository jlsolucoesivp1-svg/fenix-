BEGIN;

ALTER TABLE public.company_settings
  ADD COLUMN receipt_print_format text NOT NULL DEFAULT 'a4',
  ADD CONSTRAINT company_settings_receipt_print_format_check
    CHECK (receipt_print_format IN ('a4', 'thermal_80mm'));

COMMIT;
