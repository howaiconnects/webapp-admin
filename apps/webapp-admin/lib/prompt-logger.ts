import { createClient } from '@supabase/supabase-js'

/**
 * Lightweight prompt logging helper for /api/prompt
 *
 * Usage:
 *   import { logPrompt } from '~/lib/prompt-logger'
 *   await logPrompt({ ... })
 *
 * This helper will attempt to insert a row into the `prompt_logs` table created by
 * `supabase/migrations/001_create_prompt_logs.sql`. If SUPABASE_SERVICE_ROLE_KEY is
 * not set it will skip persistent logging (but still return).
 *
 * Notes:
 * - Do NOT log full Authorization headers or secrets. Only store trimmed headers.
 * - The helper swallows errors (logging should not break request flow).
 */

type LogEntry = {
  user_id?: string | null
  prompt_id: string
  request_payload?: any
  request_headers?: Record<string, any>
  response_body?: any
  status_code?: number
  latency_ms?: number
  error_message?: string | null
  error_details?: any
  adapter?: string | null
  run_id?: string | null
  env?: string | null
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

export async function logPrompt(entry: LogEntry): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // Supabase not configured for server-side writes; skip persistent logging.
    console.info('[prompt-logger] skipping DB log (SUPABASE_SERVICE_ROLE_KEY missing)', { promptId: entry.prompt_id })
    return
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      global: { headers: { 'x-supabase-ttl': '0' } },
    })

    // Trim headers to remove Authorization-like secrets
    const safeHeaders = (entry.request_headers && typeof entry.request_headers === 'object')
      ? Object.fromEntries(
          Object.entries(entry.request_headers).map(([k, v]) => {
            const key = String(k).toLowerCase()
            if (key.includes('authorization') || key.includes('cookie') || key.includes('set-cookie')) {
              return [k, '[REDACTED]']
            }
            return [k, v]
          })
        )
      : null

    // Truncate very large error details to avoid storing huge stack traces / blobs
    let safeErrorDetails: any = entry.error_details
    if (typeof safeErrorDetails === 'string' && safeErrorDetails.length > 1000) {
      safeErrorDetails = safeErrorDetails.slice(0, 1000) + '... [truncated]'
    }

    // Also truncate overly long error_message if present
    let safeErrorMessage: any = entry.error_message
    if (typeof safeErrorMessage === 'string' && safeErrorMessage.length > 500) {
      safeErrorMessage = safeErrorMessage.slice(0, 500) + '... [truncated]'
    }

    const { error } = await supabase.from('prompt_logs').insert([{
      user_id: entry.user_id || null,
      prompt_id: entry.prompt_id,
      request_payload: entry.request_payload || null,
      request_headers: safeHeaders || null,
      response_body: entry.response_body || null,
      status_code: entry.status_code || null,
      latency_ms: entry.latency_ms || null,
      error_message: safeErrorMessage || null,
      error_details: safeErrorDetails || null,
      adapter: entry.adapter || null,
      run_id: entry.run_id || null,
      env: entry.env || process.env.NODE_ENV || 'development',
    }])

    if (error) {
      console.warn('[prompt-logger] supabase insert error', error)
    } else {
      console.info('[prompt-logger] inserted prompt log', { promptId: entry.prompt_id })
    }
  } catch (err) {
    console.error('[prompt-logger] unexpected error', err)
  }
}