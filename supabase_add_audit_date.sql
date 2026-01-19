-- ==============================================================================
-- ADD MISSING COLUMN: audit_date
-- ==============================================================================

-- The requests table was missing the 'audit_date' column, which is required by the frontend form.

ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS audit_date DATE DEFAULT CURRENT_DATE;

-- Optional: If you want to backfill existing records (though likely none exist or it doesn't matter)
UPDATE public.requests SET audit_date = created_at::DATE WHERE audit_date IS NULL;
