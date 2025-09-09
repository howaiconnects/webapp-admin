declare module '@howaiconnects/adapters' {
  // Minimal declarations to satisfy TypeScript imports in the app.
  // Re-export the LatitudeAdapter class type from the monorepo source.
  export { LatitudeAdapter } from '../../packages/adapters/latitude-adapter';
  // Re-export adapter public types (if needed)
  export * from '../../packages/adapters/types/adapter';
}