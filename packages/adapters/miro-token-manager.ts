interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
}

import { AdapterError } from './types/adapter';

class MiroTokenManager {
  private tokenCache: Map<string, {
    accessToken: string;
    refreshToken: string;
    expiry: Date;
    refreshPromise?: Promise<TokenSet>;
  }>;

  constructor() {
    this.tokenCache = new Map();
  }

  // Proactive token refresh (5 minutes before expiry)
  async getValidToken(accountId: string): Promise<string> {
    const cached = this.tokenCache.get(accountId);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    
    if (cached && cached.expiry > new Date(now.getTime() + bufferTime)) {
      return cached.accessToken;
    }
    
    // Prevent concurrent refresh requests
    if (cached?.refreshPromise) {
      await cached.refreshPromise;
      return this.tokenCache.get(accountId)!.accessToken;
    }
    
    const refreshPromise = this.refreshToken(accountId);
    if (cached) {
      cached.refreshPromise = refreshPromise;
    }
    
    const newTokens = await refreshPromise;
    return newTokens.access_token;
  }
  
  private async refreshToken(accountId: string): Promise<TokenSet> {
    // OAuth2 refresh implementation with retry logic
    return this.withRetry(async () => {
      // Fetch refreshToken from DB or cache - implement Prisma query
      // const account = await prisma.miroAccount.findUnique({ where: { id: accountId }, select: { refreshToken: true } });
      // const refreshToken = account?.refreshToken || '';
      const refreshToken = ''; // Placeholder - implement DB fetch
      
      const response = await fetch('https://api.miro.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.MIRO_CLIENT_ID!,
          client_secret: process.env.MIRO_CLIENT_SECRET!
        })
      });
      
      if (!response.ok) {
        throw new AdapterError(`Token refresh failed: ${response.status}`, { code: 'TOKEN_REFRESH_ERROR' });
      }
      
      const tokens: TokenSet = await response.json() as TokenSet;
      
      // Update cache and database
      this.tokenCache.set(accountId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiry: new Date(Date.now() + tokens.expires_in * 1000)
      });
      
      // Async database update (non-blocking) - implement Prisma update
      // await prisma.miroAccount.update({ where: { id: accountId }, data: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000) } });
      console.log('Update tokens in DB for accountId:', accountId); // Placeholder
      
      return tokens;
    }, 3, [401, 403]); // Don't retry on auth errors
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, noRetryCodes: number[] = []): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i === maxRetries || noRetryCodes.includes((error as Response)?.status)) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
      }
    }
    throw lastError!;
  }
}

export { MiroTokenManager };