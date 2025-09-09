import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@howaiconnects/auth/lib/supabase';
import { AirtableAdapter } from '../../../../../packages/adapters/airtable-adapter';

/**
 * Server-side proxy for Airtable operations.
 *
 * Supported endpoints:
 * - GET    /api/airtable?baseId={baseId}&table={table}           -> list records
 * - POST   /api/airtable                                          -> create record { baseId, table, fields }
 * - PATCH  /api/airtable/{recordId}                               -> update record { baseId, table, fields }
 * - DELETE /api/airtable/{recordId}                               -> delete record { baseId, table }
 *
 * Authentication:
 * - Requires a valid Supabase session (server helper).
 *
 * Notes:
 * - Instantiates AirtableAdapter server-side (uses process.env.AIRTABLE_API_KEY).
 * - Sanitizes responses to avoid leaking secrets.
 * - Basic logging added (no secrets).
 *
 * Manual test instructions:
 * - Use your browser session cookies to authenticate. Example curl pattern (replace cookie header with your Supabase auth cookie):
 *   curl "http://localhost:3000/api/airtable?baseId=BASE_ID&table=TableName" -H "Cookie: __session=YOUR_COOKIE"
 *
 * - Create record:
 *   curl -X POST "http://localhost:3000/api/airtable" -H "Content-Type: application/json" -b "YOUR_COOKIE" -d '{"baseId":"BASE_ID","table":"TableName","fields":{"Name":"Test"}}'
 *
 * - Update record:
 *   curl -X PATCH "http://localhost:3000/api/airtable/recXXXXXXXX" -H "Content-Type: application/json" -b "YOUR_COOKIE" -d '{"baseId":"BASE_ID","table":"TableName","fields":{"Name":"Updated"}}'
 *
 * - Delete record:
 *   curl -X DELETE "http://localhost:3000/api/airtable/recXXXXXXXX?baseId=BASE_ID&table=TableName" -b "YOUR_COOKIE"
 */

/* Utility: simple logger (no secrets) */
function log(...args: any[]) {
  // prefix to make searching logs easier
  console.info('[api/airtable]', ...args);
}

/* Sanitize Airtable record(s) to only expose id, fields, createdTime */
function sanitizeRecord(record: any) {
  if (!record || typeof record !== 'object') return null;
  return {
    id: record.id,
    fields: record.fields ?? {},
    createdTime: record.createdTime ?? record.created_at ?? null,
  };
}

async function ensureAuth(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;
    if (!session || !session.user) return null;
    return { supabase, session };
  } catch (err) {
    return null;
  }
}

async function getAdapterInstance() {
  const adapter = new AirtableAdapter();
  // allow adapter to read env var; pass empty config so it uses process.env when needed
  await adapter.init({});
  return adapter;
}

/* Handler: List records */
export async function GET(req: NextRequest) {
  try {
    const auth = await ensureAuth(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const baseId = url.searchParams.get('baseId') ?? '';
    const table = url.searchParams.get('table') ?? '';

    if (!baseId || !table) {
      return NextResponse.json({ message: 'baseId and table query parameters are required' }, { status: 400 });
    }

    log('listRecords request', { baseId, table, user: auth.session.user.id });

    const adapter = await getAdapterInstance();
    try {
      const records = await adapter.listRecords(baseId, table);
      const sanitized = Array.isArray(records) ? records.map(sanitizeRecord).filter(Boolean) : [];
      return NextResponse.json(sanitized, { status: 200 });
    } catch (err: any) {
      log('adapter.listRecords error', { message: err?.message, code: err?.code });
      const status = err?.code === 'AUTH_FAILED' ? 401 : 500;
      return NextResponse.json({ message: err?.message ?? 'Airtable error' }, { status });
    } finally {
      await adapter.close();
    }
  } catch (err: any) {
    log('GET unexpected error', err?.message ?? err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/* Handler: Create record */
export async function POST(req: NextRequest) {
  try {
    const auth = await ensureAuth(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const baseId = body?.baseId;
    const table = body?.table;
    const fields = body?.fields;

    if (!baseId || !table || !fields || typeof fields !== 'object') {
      return NextResponse.json({ message: 'baseId, table and fields are required in body' }, { status: 400 });
    }

    log('createRecord request', { baseId, table, user: auth.session.user.id });

    const adapter = await getAdapterInstance();
    try {
      // Use direct fetch to Airtable API - adapter doesn't expose create in this minimal adapter,
      // so implement a small POST here via adapter.config baseUrl + apiKey
      const response = await fetch(`${adapter.config.baseUrl}/v0/${baseId}/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adapter.config.apiKey || process.env.AIRTABLE_API_KEY}`,
        },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        log('airtable create error', { status: response.status, statusText: response.statusText });
        return NextResponse.json({ message: errorData?.error?.message ?? 'Airtable create failed' }, { status: response.status });
      }

      const data = await response.json();
      const sanitized = sanitizeRecord(data);
      return NextResponse.json(sanitized, { status: 201 });
    } catch (err: any) {
      log('create unexpected error', err?.message ?? err);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    } finally {
      await adapter.close();
    }
  } catch (err: any) {
    log('POST unexpected error', err?.message ?? err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/* Handler: PATCH (update record) */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await ensureAuth(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    // Next.js app router exposes pathname; extract recordId from pathname
    const pathname = url.pathname || '';
    const parts = pathname.split('/').filter(Boolean);
    const recordId = parts[parts.length - 1]; // last segment
    if (!recordId) {
      return NextResponse.json({ message: 'recordId path parameter is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const baseId = body?.baseId;
    const table = body?.table;
    const fields = body?.fields;

    if (!baseId || !table || !fields || typeof fields !== 'object') {
      return NextResponse.json({ message: 'baseId, table and fields are required in body' }, { status: 400 });
    }

    log('updateRecord request', { recordId, baseId, table, user: auth.session.user.id });

    const adapter = await getAdapterInstance();
    try {
      const response = await fetch(`${adapter.config.baseUrl}/v0/${baseId}/${table}/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adapter.config.apiKey || process.env.AIRTABLE_API_KEY}`,
        },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        log('airtable update error', { status: response.status, statusText: response.statusText });
        return NextResponse.json({ message: errorData?.error?.message ?? 'Airtable update failed' }, { status: response.status });
      }

      const data = await response.json();
      const sanitized = sanitizeRecord(data);
      return NextResponse.json(sanitized, { status: 200 });
    } catch (err: any) {
      log('update unexpected error', err?.message ?? err);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    } finally {
      await adapter.close();
    }
  } catch (err: any) {
    log('PATCH unexpected error', err?.message ?? err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/* Handler: DELETE (delete record) */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await ensureAuth(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const pathname = url.pathname || '';
    const parts = pathname.split('/').filter(Boolean);
    const recordId = parts[parts.length - 1]; // last segment
    const baseId = url.searchParams.get('baseId') ?? '';
    const table = url.searchParams.get('table') ?? '';

    if (!recordId || !baseId || !table) {
      return NextResponse.json({ message: 'recordId path param and baseId & table query params are required' }, { status: 400 });
    }

    log('deleteRecord request', { recordId, baseId, table, user: auth.session.user.id });

    const adapter = await getAdapterInstance();
    try {
      const response = await fetch(`${adapter.config.baseUrl}/v0/${baseId}/${table}/${recordId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adapter.config.apiKey || process.env.AIRTABLE_API_KEY}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        log('airtable delete error', { status: response.status, statusText: response.statusText });
        return NextResponse.json({ message: errorData?.error?.message ?? 'Airtable delete failed' }, { status: response.status });
      }

      const data = await response.json().catch(() => ({ id: recordId }));
      // Airtable returns { id: 'rec...', deleted: true } for delete
      return NextResponse.json({ id: data?.id ?? recordId, deleted: data?.deleted ?? true }, { status: 200 });
    } catch (err: any) {
      log('delete unexpected error', err?.message ?? err);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    } finally {
      await adapter.close();
    }
  } catch (err: any) {
    log('DELETE unexpected error', err?.message ?? err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}