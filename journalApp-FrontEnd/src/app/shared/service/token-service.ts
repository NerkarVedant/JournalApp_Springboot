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
  
  // Store credentials for silent refresh
  storeCredentials(username: string, password: string) {
    this.credentials = { username, password };
    // Optionally store encrypted credentials in sessionStorage for persistence
    // but be careful with security implications
  }
  
  // Clear stored credentials (call on logout)
  clearCredentials() {
    this.credentials = null;
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

  private refreshToken() {
    // Check if we have stored credentials
    if (!this.credentials) {
      console.warn('[TokenService] ⚠️ No credentials stored for token refresh');
      return;
    }
    
    console.log('[TokenService] Starting automatic token refresh...');
    
    const { username, password } = this.credentials;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Call the login API with stored credentials
    this.http.post(`${this.baseUrl}/public/login`, {
      username,
      password
    }, { headers, responseType: 'text' }).subscribe({
      next: (response: any) => {
        console.log('[TokenService] Token refresh response received');
        
        let newToken = null;
        
        // Handle direct string token response
        if (typeof response === 'string' && response.length > 20) {
          newToken = response.trim();
          console.log('[TokenService] ├── Token extracted from direct string response');
          console.log(`[TokenService] ├── Will be stored with key "${this.tokenKey}"`);
        }
        // As a fallback, try to parse as JSON if it looks like JSON
        else if (typeof response === 'string' && response.includes('{')) {
          try {
            const jsonResponse = JSON.parse(response);
            // Check different possible field names that the backend might use
            if (jsonResponse.token) {
              newToken = jsonResponse.token;
              console.log('[TokenService] ├── Token found in response field "token"');
            } else if (jsonResponse.accessToken) {
              newToken = jsonResponse.accessToken;
              console.log('[TokenService] ├── Token found in response field "accessToken"');
            } else if (jsonResponse.jwtToken) {
              newToken = jsonResponse.jwtToken;
              console.log('[TokenService] ├── Token found in response field "jwtToken"');
            }
            
            // Make it clear we'll still store with our consistent key
            if (newToken) {
              console.log(`[TokenService] ├── Will be stored consistently with key "${this.tokenKey}"`);
            }
          } catch (e) {
            console.error('[TokenService] ├── Error parsing response as JSON:', e);
          }
        }
        
        if (newToken) {
          // Update the token seamlessly - always use tokenKey for storage
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.tokenKey, newToken);
            console.log(`[TokenService] ✅ Token refreshed successfully and stored as "${this.tokenKey}"`);
            
            // Schedule next refresh after storing
            this.scheduleRefresh(newToken);
          }
          
          try {
            // Try to decode token to show new expiry
            const decoded: DecodedToken = jwtDecode(newToken);
            if (decoded.exp) {
              const newExpiry = new Date(decoded.exp * 1000);
              console.log(`[TokenService] └── New token expires: ${newExpiry.toLocaleString()}`);
            }
          } catch (e) {
            console.log('[TokenService] └── Could not decode new token expiry');
          }
        } else {
          console.error('[TokenService] ❌ No token found in refresh response');
        }
      },
      error: (err) => {
        console.error('[TokenService] ❌ Token refresh failed', err);
        // Do not logout - just log the error
      }
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
}
