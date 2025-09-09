-- Migration: create prompt_logs table
-- Purpose: persistent request/response logging for /api/prompt
-- Run this migration against your Supabase/Postgres instance (supabase db push or psql)

CREATE TABLE IF NOT EXISTS public.prompt_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Request metadata
  user_id text,            -- Supabase user id if available
  prompt_id text NOT NULL, -- identifier of the prompt invoked
  request_payload jsonb,   -- original request body (prompt params)
  request_headers jsonb,   -- trimmed headers (do NOT store full auth secrets)

  -- Response / result
  response_body jsonb,     -- AI result payload (may be large)
  status_code integer,     -- HTTP-style status code for the result
  latency_ms integer,      -- measured latency in milliseconds

  -- Error info if any
  error_message text,
  error_details jsonb,

  -- Optional routing/tracing fields
  adapter text,            -- e.g., "latitude"
  run_id text,             -- optional id returned by adapter for tracing
  env text                 -- deployment environment (dev/staging/prod)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prompt_logs_user_id ON public.prompt_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_prompt_id ON public.prompt_logs (prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_created_at ON public.prompt_logs (created_at);

-- Optional: a lightweight retention policy (keep 90 days). Uncomment to enable (requires pg_cron or scheduled job).
-- DELETE FROM public.prompt_logs WHERE created_at < now() - interval '90 days';