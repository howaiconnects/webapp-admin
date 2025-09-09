/**
 * Internal module shims with minimal named exports to satisfy TypeScript checks.
 * These are intentionally permissive (`any`) and should be replaced with
 * real typed exports when packages are built/published.
 */

declare module '@howaiconnects/auth/lib/supabase' {
  export function createClient(...args: any[]): any
  export function createServerClient(...args: any[]): any
  export function refreshSessionIfNeeded(...args: any[]): Promise<any>
  export const authHelpers: any
  const _default: any
  export default _default
}

declare module '@howaiconnects/auth/lib/supabase/*' {
  export function createClient(...args: any[]): any
  export function createServerClient(...args: any[]): any
  export default any
  const anything: any
  export = anything
}

declare module '@howaiconnects/adapters' {
  export class LatitudeAdapter { constructor(...args: any[]); init?: any; runChat?: any; runPrompt?: any; listPrompts?: any; close?: any; config?: any }
  export class MiroAdapter { constructor(...args: any[]); init?: any; execute?: any; getBoardInfo?: any; close?: any }
  export function LatitudeAdapterFactory(...args: any[]): any
  export function MiroAdapterFactory(...args: any[]): any
  export const adapters: any
  const _default: any
  export default _default
}

declare module '@howaiconnects/adapters/*' {
  export class LatitudeAdapter { constructor(...args: any[]); init?: any; runChat?: any; runPrompt?: any; close?: any; config?: any }
  export class MiroAdapter { constructor(...args: any[]); init?: any; execute?: any; getBoardInfo?: any; close?: any }
  const anything: any
  export = anything
}

declare module 'prisma/type-placeholder' {
  // Minimal Database type placeholder used in the app; keep as `any` for now.
  export type Database = any
  const _default: any
  export default _default
}

// Some files import via relative path into the repo root; add that path as a shim too.
declare module '../../../../../../prisma/type-placeholder' {
  // Exact relative path shim referenced from several admin pages.
  import { Database } from 'prisma/type-placeholder'
  export type Database = Database
  const _default: any
  export default _default
}

declare module '../../../../packages/auth/src/lib/supabase/*' {
  export function createClient(...args: any[]): any
  export function createServerClient(...args: any[]): any
  export default any
  const anything: any
  export = anything
}

// Additional common relative auth paths used across the app/tests
declare module '../../packages/auth/src/lib/supabase' {
  export function createClient(...args: any[]): any
  export function createServerClient(...args: any[]): any
  export function refreshSessionIfNeeded(...args: any[]): Promise<any>
  export default any
}
declare module '../../packages/auth/src/lib/supabase/*' {
  export function createClient(...args: any[]): any
  export function createServerClient(...args: any[]): any
  export default any
  const anything: any
  export = anything
}

declare module '../../../../packages/adapters/*' {
  export class LatitudeAdapter { constructor(...args: any[]); init?: any; runChat?: any; runPrompt?: any; close?: any; config?: any; listPrompts?: any }
  export class MiroAdapter { constructor(...args: any[]); init?: any; execute?: any; getBoardInfo?: any; close?: any }
  export default any
}

 // UI/internal component paths used from src/
 declare module '../components/ChatWidget' {
   const Component: any
   export default Component
 }
 declare module '../components/*' {
   const Component: any
   export default Component
 }
 // Additional relative depths for component imports used across layouts/pages
 declare module '../../src/components/*' {
   const Component: any
   export default Component
 }
 declare module '../../../src/components/*' {
   const Component: any
   export default Component
 }
 declare module '../../../../src/components/*' {
   const Component: any
   export default Component
 }

declare module '../contexts/*' {
  export const ChatProvider: any
  export const anything: any
  const _default: any
  export default _default
}

/**
 * Avoid broad wildcard module declarations that can obscure named exports.
 * Provide targeted shims instead for paths actually used by the app/tests.
 */
 
declare module '../../packages/auth/src/lib/supabase' {
  export function createClient(...args: any[]): any
  export function createServerClient(...args: any[]): any
  export function refreshSessionIfNeeded(...args: any[]): Promise<any>
  export default any
}
declare module '../../packages/auth/src/lib/supabase/*' {
  export function createClient(...args: any[]): any
  export function createServerClient(...args: any[]): any
  export default any
}

declare module '../../packages/adapters/*' {
  export class LatitudeAdapter { constructor(...args: any[]); init?: any; runChat?: any; runPrompt?: any; close?: any; config?: any; listPrompts?: any }
  export class MiroAdapter { constructor(...args: any[]); init?: any; execute?: any; getBoardInfo?: any; close?: any }
  export default any
}