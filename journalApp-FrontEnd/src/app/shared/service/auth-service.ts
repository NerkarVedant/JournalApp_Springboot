import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  baseUrl: string = 'http://localhost:8080';
  private tokenKey = 'authToken';
  private userKey = 'userData';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  isAuthenticated(): boolean {
    // During SSR, consider users as not authenticated
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    
    const token = this.getAuthToken();
    return !!token && !this.isTokenExpired(token);
  }

  getAuthToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(this.tokenKey);
  }

  loginUser(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return new Observable(observer => {
      // Use responseType: 'text' to handle plain text responses
      this.http.post(`${this.baseUrl}/public/login`, {
        username,
        password
      }, { headers, responseType: 'text' }).subscribe({
        next: (response: any) => {
          console.log('[AuthService] Login response received');
          console.log('[AuthService] Response type:', typeof response);
          
          let token = null;
          
          // Handle direct string token response (which seems to be your case)
          if (typeof response === 'string' && response.length > 20) {
            token = response.trim();
            console.log('[AuthService] Token extracted directly from string response');
          }
          
          // As a fallback, try to parse as JSON if it looks like JSON
          else if (typeof response === 'string' && response.includes('{')) {
            try {
              const jsonResponse = JSON.parse(response);
              if (jsonResponse.token) {
                token = jsonResponse.token;
                console.log('[AuthService] Token extracted from parsed JSON "token" field');
              } else if (jsonResponse.accessToken) {
                token = jsonResponse.accessToken;
                console.log('[AuthService] Token extracted from parsed JSON "accessToken" field');
              } else if (jsonResponse.jwtToken) {
                token = jsonResponse.jwtToken;
                console.log('[AuthService] Token extracted from parsed JSON "jwtToken" field');
              }
            } catch (e) {
              console.error('[AuthService] Error parsing response as JSON:', e);
            }
          }
          
          if (token) {
            // Store the token using our consistent key
            console.log(`[AuthService] Storing token with key "${this.tokenKey}"`);
            this.setAuthToken(token);
            
            // Also store credentials for automatic token refresh
            if (isPlatformBrowser(this.platformId)) {
              try {
                // Check if TokenService is available via injector
                const tokenService = (window as any).tokenService;
                if (tokenService) {
                  console.log('[AuthService] Storing credentials in TokenService for automatic refresh');
                  tokenService.storeCredentials(username, password);
                  // Ensure TokenService has the token (it will use its own consistent key)
                  tokenService.setToken(token);
                }
              } catch (e) {
                console.error('[AuthService] Could not access TokenService for credential storage:', e);
              }
            }
            
            observer.next({ success: true });
            observer.complete();
          } else {
            console.error('[AuthService] No token found in response');
            observer.error({ error: 'No token found in response' });
          }
        },
        error: (error) => {
          console.error('[AuthService] Login error:', error);
          observer.error(error);
        }
      });
    });
  }
  
  // Keep the old method for backward compatibility
  login(username: string, password: string): boolean {
    console.warn('Deprecated login method called. Use loginUser() instead');
    this.loginUser(username, password).subscribe({
      next: () => {},
      error: () => {}
    });
    return false;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('[AuthService] Logging out user and clearing tokens');
      
      // Clear primary token key
      localStorage.removeItem(this.tokenKey);
      
      // Also clear any legacy token keys that might exist
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      
      // Clear other user data
      localStorage.removeItem(this.userKey);
      localStorage.removeItem('rememberMe');
      
      // Clean any timers and credentials in TokenService
      try {
        const tokenService = (window as any).tokenService;
        if (tokenService) {
          console.log('[AuthService] Clearing TokenService credentials on logout');
          tokenService.clearCredentials();
        }
      } catch (e) {
        console.error('[AuthService] Could not access TokenService for credential clearing:', e);
      }
      
      console.log('[AuthService] User logged out successfully');
    }
  }

  signUp(username: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Updated endpoint to match your backend API
    return this.http.post(`${this.baseUrl}/public/signup`, {
      username,
      password
    }, { headers });
  }


  // getAuthToken(): string | null {
  //   return localStorage.getItem(this.tokenKey);
  // }

  setAuthToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
      
      // Optionally decode and store user data from token
      try {
        const userData = this.decodeToken(token);
        if (userData) {
          localStorage.setItem(this.userKey, JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }

  clearAuthToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  isTokenValid(): boolean {
    const token = this.getAuthToken();
    return !!token && !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (payload && payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        return expirationDate < new Date();
      }
      return true;
    } catch (error) {
      return true;
    }
  }

  decodeToken(token: string): any {
    try {
      console.log('Attempting to decode token');
      // Check if token is valid format for decoding
      if (!token || token.split('.').length !== 3) {
        console.error('Invalid token format');
        return null;
      }
      
      // Simple token decoding (not secure for production)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      try {
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log('Token decoded successfully');
        
        // Log token expiration details without exposing sensitive data
        if (payload.exp) {
          const expirationDate = new Date(payload.exp * 1000);
          console.log('Token expires:', expirationDate);
          console.log('Current time:', new Date());
          console.log('Token expired:', expirationDate < new Date());
        } else {
          console.log('Token has no expiration date');
        }
        
        return payload;
      } catch (decodeError) {
        console.error('Error in base64 decoding:', decodeError);
        return null;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  refreshAuthToken(): void {
    const token = this.getAuthToken();
    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      
      this.http.post(`${this.baseUrl}/public/refresh-token`, {}, { headers }).subscribe({
        next: (response: any) => {
          if (response && response.token) {
            this.setAuthToken(response.token);
          }
        },
        error: (error) => {
          console.error('Token refresh error:', error);
          if (error.status === 401) {
            // Token invalid or expired
            this.clearAuthToken();
          }
        }
      });
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  isUserAdmin(): boolean {
    try {
      const userData = this.getUserDetails();
      return userData && userData.role === 'ADMIN';
    } catch (error) {
      return false;
    }
  }

  getUserRole(): string | null {
    try {
      const userData = this.getUserDetails();
      return userData ? userData.role : null;
    } catch (error) {
      return null;
    }
  }

  getUserDetails(): any {
    try {
      if (!isPlatformBrowser(this.platformId)) {
        return null;
      }
      const userData = localStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user details:', error);
      return null;
    }
  }

  updateUserDetails(details: any): void {
    const token = this.getAuthToken();
    if (token) {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
      
      this.http.put(`${this.baseUrl}/user/update-profile`, details, { headers }).subscribe({
        next: (response: any) => {
          if (response && response.success) {
            // Update local user data
            const userData = this.getUserDetails();
            if (userData && isPlatformBrowser(this.platformId)) {
              const updatedData = { ...userData, ...details };
              localStorage.setItem(this.userKey, JSON.stringify(updatedData));
            }
          }
        },
        error: (error) => {
          console.error('Update user details error:', error);
        }
      });
    }
  }

  deleteUserAccount(): void {
    const token = this.getAuthToken();
    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      
      this.http.delete(`${this.baseUrl}/user/delete-account`, { headers }).subscribe({
        next: (response: any) => {
          this.logout();
        },
        error: (error) => {
          console.error('Delete account error:', error);
        }
      });
    }
  }

  resetPassword(email: string): boolean {
    try {
      this.http.post(`${this.baseUrl}/public/reset-password`, { email }).subscribe({
        next: (response: any) => {
          return response && response.success;
        },
        error: (error) => {
          console.error('Reset password error:', error);
          return false;
        }
      });
      
      return true; // Assume success for synchronous return
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  changePassword(oldPassword: string, newPassword: string): boolean {
    const token = this.getAuthToken();
    if (token) {
      try {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        });
        
        this.http.post(`${this.baseUrl}/user/change-password`, {
          oldPassword,
          newPassword
        }, { headers }).subscribe({
          next: (response: any) => {
            return response && response.success;
          },
          error: (error) => {
            console.error('Change password error:', error);
            return false;
          }
        });
        
        return true; // Assume success for synchronous return
      } catch (error) {
        console.error('Error changing password:', error);
        return false;
      }
    }
    return false;
  }

  // Get headers with authorization token for API requests
  getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
}
