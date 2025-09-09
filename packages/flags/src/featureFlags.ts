// Simple env-driven feature flags helper
// Usage: import { isFeatureEnabled } from 'packages/flags/src/featureFlags'
// Feature names become env vars like FEATURE_PLAYGROUND=1 or FEATURE_PLAYGROUND=true
export function isFeatureEnabled(flagName: string): boolean {
  if (!flagName) return false
  const envKey = `FEATURE_${flagName.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`
  const raw = process.env[envKey]
  if (!raw) return false
  const v = String(raw).toLowerCase().trim()
  return v === '1' || v === 'true' || v === 'on' || v === 'yes'
}

export function requireFeature(flagName: string): void {
  if (!isFeatureEnabled(flagName)) {
    throw new Error(`Feature disabled: ${flagName}`)
  }
}