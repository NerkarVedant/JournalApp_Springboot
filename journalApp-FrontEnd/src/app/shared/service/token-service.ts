// token.service.ts

import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface DecodedToken {
  exp: number; // expiry in seconds
  sub: string; // subject (usually username)
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private refreshTimer: any;
  private baseUrl: string = 'http://localhost:8080';
  private credentials: { username: string, password: string } | null = null;
  private tokenKey: string = 'authToken'; // Use the same key as AuthService
  private refreshTokenKey: string = 'refreshToken'; // Key for refresh token storage

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  setToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      // Store token with our consistent key
      localStorage.setItem(this.tokenKey, token);
      
      // Schedule the refresh timer
      this.scheduleRefresh(token);
      
      console.log(`[TokenService] Token updated in localStorage using key "${this.tokenKey}"`);
      
      // Clean up any duplicate tokens that might exist with different keys
      const otherKeys = ['jwtToken', 'token', 'accessToken'];
      for (const key of otherKeys) {
        if (key !== this.tokenKey && localStorage.getItem(key)) {
          console.log(`[TokenService] Removing duplicate token with key "${key}"`);
          localStorage.removeItem(key);
        }
      }
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(this.tokenKey); // Use tokenKey for consistency
  }
  
  /**
   * Check if the current auth token is valid (exists and not expired)
   * @returns boolean indicating if token is valid
   */
  isAuthTokenValid(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    
    const token = this.getToken();
    
    if (!token) {
      return false;
    }
    
    try {
      const decoded: DecodedToken = jwtDecode(token);
      const expiry = decoded.exp * 1000; // convert to ms
      const now = Date.now();
      
      return expiry > now;
    } catch (e) {
      console.error('[TokenService] Error decoding token for validity check:', e);
      return false;
    }
  }

  // Get refresh token from localStorage
  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Set refresh token in localStorage
  setRefreshToken(refreshToken: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
      console.log(`[TokenService] Refresh token stored with key "${this.refreshTokenKey}"`);
    }
  }

  // Clear refresh token from localStorage
  clearRefreshToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.refreshTokenKey);
      console.log('[TokenService] Refresh token cleared');
    }
  }
  
  // Store credentials for silent refresh (legacy, may be deprecated)
  storeCredentials(username: string, password: string) {
    this.credentials = { username, password };
    // Optionally store encrypted credentials in sessionStorage for persistence
    // but be careful with security implications
  }
  
  // Clear stored credentials (call on logout)
  clearCredentials() {
    this.credentials = null;
    // Also clear refresh token
    this.clearRefreshToken();
  }

  private scheduleRefresh(token: string) {
    const decoded: DecodedToken = jwtDecode(token);
    const expiry = decoded.exp * 1000; // convert to ms
    const now = Date.now();
    const delay = expiry - now - 15000; // refresh 15 sec before expiry
    
    console.log('[TokenService] Token details:');
    console.log(`[TokenService] ├── Expiry: ${new Date(expiry).toLocaleString()}`);
    console.log(`[TokenService] ├── Current time: ${new Date(now).toLocaleString()}`);
    console.log(`[TokenService] └── Next refresh in: ${Math.round(delay/1000)} seconds (${Math.round(delay/60000)} minutes)`);

    if (delay <= 0) {
      console.warn('[TokenService] ⚠️ Token already expired or too close to expiry!');
      return;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      console.log('[TokenService] Previous refresh timer cleared');
    }

    this.refreshTimer = setTimeout(() => {
      console.log('[TokenService] 🔄 Refresh timer triggered at:', new Date().toLocaleString());
      this.refreshToken();
    }, delay);
  }

  // Changed from private to public to allow direct calling
  refreshToken(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Get the refresh token from localStorage
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        console.warn('[TokenService] ⚠️ No refresh token available for token refresh');
        resolve(false);
        return;
      }
      
      console.log('[TokenService] Starting automatic token refresh using refresh token...');
      
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      
      // Call the refresh-token API with the refresh token
      // Request body: { token: refreshToken }
      this.http.post(`${this.baseUrl}/public/refresh-token`, {
        token: refreshToken
      }, { headers, responseType: 'text' }).subscribe({
        next: (response: any) => {
          console.log('[TokenService] Token refresh response received');
          
          let newToken = null;
          
          // Handle direct string JWT token response
          if (typeof response === 'string' && response.length > 20) {
            newToken = response.trim();
            console.log('[TokenService] ├── JWT token received as string response');
          }
          
          if (newToken) {
            // Update the token seamlessly - always use tokenKey for storage
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem(this.tokenKey, newToken);
              console.log(`[TokenService] ✅ JWT token refreshed successfully and stored as "${this.tokenKey}"`);
              
              // Schedule next refresh after storing
              this.scheduleRefresh(newToken);
              
              // Indicate success
              resolve(true);
            } else {
              resolve(false);
            }
            
            try {
              // Try to decode token to show new expiry
              const decoded: DecodedToken = jwtDecode(newToken);
              if (decoded.exp) {
                const newExpiry = new Date(decoded.exp * 1000);
                console.log(`[TokenService] └── New JWT token expires: ${newExpiry.toLocaleString()}`);
              }
            } catch (e) {
              console.log('[TokenService] └── Could not decode new token expiry');
            }
          } else {
            console.error('[TokenService] ❌ No JWT token found in refresh response');
            resolve(false);
          }
        },
        error: (err) => {
          console.error('[TokenService] ❌ Token refresh failed', err);
          // Optional: Handle specific error cases, such as invalid refresh token
          if (err.status === 401) {
            console.warn('[TokenService] Refresh token appears to be invalid or expired');
            // Clear the invalid refresh token but don't logout automatically
            this.clearRefreshToken();
          }
          resolve(false);
        }
      });
    });
  }  // Call this on app startup (optional)
  // Consolidate any tokens that might be stored with inconsistent keys
  private consolidateTokens(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    // Check for tokens stored with different keys
    const possibleKeys = ['authToken', 'jwtToken', 'token', 'accessToken'];
    let existingToken: string | null = null;
    let foundKey: string | null = null;
    
    console.log('[TokenService] Checking for tokens stored with different keys');
    
    // Find any token with any of our possible keys
    for (const key of possibleKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        console.log(`[TokenService] Found token stored with key "${key}"`);
        existingToken = token;
        foundKey = key;
        break;
      }
    }
    
    // If we found a token with a different key, migrate it
    if (existingToken && foundKey && foundKey !== this.tokenKey) {
      console.log(`[TokenService] Migrating token from "${foundKey}" to "${this.tokenKey}"`);
      localStorage.setItem(this.tokenKey, existingToken);
      localStorage.removeItem(foundKey);
    }
    
    // Clean up any other token keys that might exist
    for (const key of possibleKeys) {
      if (key !== this.tokenKey) {
        const hasOldToken = localStorage.getItem(key);
        if (hasOldToken) {
          console.log(`[TokenService] Removing duplicate token with key "${key}"`);
          localStorage.removeItem(key);
        }
      }
    }
    
    // Also check for refresh token existence
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      console.log('[TokenService] Found existing refresh token');
    }
    
    return existingToken || this.getToken();
  }

  initTokenRefresh() {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[TokenService] Not in browser environment, skipping token refresh initialization');
      return;
    }
    
    // First consolidate any tokens that might be stored with different keys
    const token = this.consolidateTokens() || this.getToken();
    
    if (token) {
      console.log('[TokenService] Initializing token refresh system');
      this.scheduleRefresh(token);
    } else {
      console.log('[TokenService] No token found, refresh system not initialized');
    }
  }
  
  /**
   * Validates the current authentication state and refreshes tokens if needed
   * @returns Promise that resolves to a boolean indicating if valid authentication exists
   */
  validateTokenAndRefresh(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // First check if we have an auth token
      const authToken = this.getToken();
      
      if (authToken) {
        console.log('[TokenService] Auth token found, checking validity');
        
        try {
          // Decode and check if expired
          const decoded: DecodedToken = jwtDecode(authToken);
          const expiry = decoded.exp * 1000; // convert to ms
          const now = Date.now();
          
          // If token is not expired, we're good
          if (expiry > now) {
            console.log('[TokenService] Auth token is valid and not expired');
            resolve(true);
            return;
          } else {
            console.log('[TokenService] Auth token has expired, checking for refresh token');
          }
        } catch (e) {
          console.error('[TokenService] Error decoding auth token:', e);
        }
      } else {
        console.log('[TokenService] No auth token found, checking for refresh token');
      }
      
      // At this point, either no auth token exists or it has expired
      // Check for refresh token
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        console.log('[TokenService] No refresh token available, authentication invalid');
        resolve(false);
        return;
      }
      
      console.log('[TokenService] Refresh token found, attempting to get new auth token');
      
      // Use refresh token to get a new auth token
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      
      this.http.post(`${this.baseUrl}/public/refresh-token`, {
        token: refreshToken
      }, { headers, responseType: 'text' }).subscribe({
        next: (response: any) => {
          console.log('[TokenService] Token refresh response received');
          
          let newToken = null;
          
          // Handle direct string JWT token response
          if (typeof response === 'string' && response.length > 20) {
            newToken = response.trim();
            console.log('[TokenService] New JWT token received successfully');
          }
          
          if (newToken) {
            // Update the token seamlessly
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem(this.tokenKey, newToken);
              console.log(`[TokenService] JWT token refreshed and stored successfully`);
              
              // Schedule next refresh
              this.scheduleRefresh(newToken);
              
              // Authentication is now valid
              resolve(true);
            } else {
              resolve(false);
            }
          } else {
            console.error('[TokenService] No JWT token found in refresh response');
            resolve(false);
          }
        },
        error: (err) => {
          console.error('[TokenService] Token refresh failed', err);
          
          // If the refresh token is invalid, clear it
          if (err.status === 401) {
            console.warn('[TokenService] Refresh token appears to be invalid or expired');
            this.clearRefreshToken();
          }
          
          resolve(false);
        }
      });
    });
  }
}
