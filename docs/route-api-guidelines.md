# Route and API Guidelines

This document outlines guidelines for routes and APIs in the How AI Connects monorepo, enforcing the Next.js App Router for all apps (webapp-admin, webapp-user, etc.) and using tRPC for type-safe APIs with schemas in `packages/contracts`. These guidelines ensure consistency, security, and maintainability across the four-branch split, deprecating legacy `/pages/api` routes. Follow naming conventions from [naming-conventions.md](naming-conventions.md).

## 1. Routes (Next.js App Router)

- **Adoption**: Use App Router exclusively (`app/` directory); migrate any `/pages/` routes. Server Components by default; mark Client Components with `'use client'`.
  - **File Structure**: `app/{segment}/page.tsx` for pages, `app/{segment}/layout.tsx` for layouts, `app/{segment}/loading.tsx` for suspense.
  - **Dynamic Segments**: `[param]` for optional (`[[...slug]]` for catch-all); generate with `generateStaticParams`.
  - **Examples**:
    - Static: `app/admin/dashboard/page.tsx` → `/admin/dashboard`.
    - Dynamic: `app/admin/crm/[baseId]/page.tsx` → `/admin/crm/{baseId}`.
    - Nested: `app/user/chat/[sessionId]/messages/page.tsx` → `/user/chat/{sessionId}/messages`.
    - API: `app/api/admin/prompt/route.ts` → `POST /api/admin/prompt`.

- **App-Specific Prefixes**:
  - Admin: `/admin/*` (protected routes).
  - User: `/user/*` (public/authenticated).
  - Prompt-Lab: `/lab/*` (internal tools).
  - Playground: `/playground/*` (experimental).

- **Middleware**: `middleware.ts` at app root for auth (Supabase), redirects (e.g., `/admin/*` requires role='admin').
  - Constraints: No heavy logic; use for routing only.

- **Error Handling**: `error.tsx` per segment; global `global-error.tsx`. Use `notFound()` for 404s.
  - Logging: Sentry or console.error; return JSON for APIs.

- **Optimization**: Metadata API (`generateMetadata`), parallel routes (`@slot`), intercepting routes for modals.

## 2. API Routes

- **Structure**: `app/api/{app}/{resource}/route.ts` with HTTP methods as functions (GET, POST, etc.).
  - **Examples**:
    ```typescript
    // app/api/admin/prompt/route.ts
    import { NextRequest, NextResponse } from 'next/server';
    import { createTRPCRouter } from '@howaiconnects/contracts/server'; // From packages/contracts

    const router = createTRPCRouter({
      runPrompt: publicProcedure.input(z.object({ message: z.string() })).mutation(async ({ input }) => {
        // Call LatitudeAdapter
        return { reply: 'AI response' };
      }),
    });

    export async function POST(req: NextRequest) {
      try {
        const body = await req.json();
        const result = await router.runPrompt({ input: body });
        return NextResponse.json(result);
      } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
      }
    }
    ```
  - **Authentication**: Verify Supabase JWT in headers; use `getServerSession` or middleware.
  - **Validation**: Zod schemas from `packages/contracts` (e.g., `z.object({ message: z.string().min(1) })`).
  - **Rate Limiting**: Upstash or middleware; per-user via Supabase.

- **Error Responses**: Standard JSON `{ error: string, code: number }`; HTTP status (400 bad request, 401 unauthorized, 500 internal).
  - No stack traces in prod; log to Supabase or Sentry.

- **CORS**: Configure in `next.config.js`; allow origins for frontend apps.

- **Versioning**: `/api/v1/{resource}`; deprecate v1 via redirects.

## 3. API Contracts (packages/contracts)

- **Tool Choice**: tRPC preferred for type-safe, end-to-end types (client/server); fallback to OpenAPI for external docs.
  - **tRPC Setup**: `packages/contracts/src/router.ts` exports routers/procedures.
    - Structure: `createTRPCRouter({ admin: adminRouter, user: userRouter })`.
    - Inputs/Outputs: Zod for validation; infer types (`AppRouter`).
    - Integration: Import in app API routes; client hooks in components (`useQuery` from `@trpc/react-query`).
  - **OpenAPI Alternative**: For non-tRPC endpoints; generate spec in `packages/contracts/openapi.yaml`; use swagger-ui for docs.
    - Tools: `@trpc/openapi` to auto-generate from tRPC.

- **Schemas Location**: `packages/contracts/src/schemas/` (e.g., `prompt.schema.ts` with Zod).
  - Shared: Reuse across apps (e.g., `PromptInput` for admin/user).
  - Versioning: `v1.prompt.schema.ts`.

- **Client Usage**: `@howaiconnects/contracts/client` for typed clients; wrap in `createTRPCReact<AppRouter>()`.

## 4. Guidelines and Enforcement

- **Security**: All APIs require auth except public; validate inputs to prevent injection.
- **Performance**: Server-side rendering for routes; cache APIs with `revalidatePath`.
- **Testing**: Unit tests for procedures (`packages/contracts/__tests__/`); integration in app tests.
- **Documentation**: Auto-gen from tRPC (docs.trpc.io); include in README.
- **Migration**: From legacy APIs: Redirect or deprecate with 410 status.
- **Enforcement**: ESLint rules for route files; CI runs `turbo run type-check` to validate contracts.

Adhere to these for scalable, secure APIs. Propose changes via ADR.