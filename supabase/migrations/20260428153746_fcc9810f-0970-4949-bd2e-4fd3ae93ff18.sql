ALTER TABLE public.savings_log ADD COLUMN IF NOT EXISTS month_id uuid;
CREATE INDEX IF NOT EXISTS savings_log_month_id_idx ON public.savings_log(month_id);