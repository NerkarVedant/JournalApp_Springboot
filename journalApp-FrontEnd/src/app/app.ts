import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { TokenService } from './shared/service/token-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected title = 'journalApp-FrontEnd';
  
  constructor(
    private tokenService: TokenService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only access window in browser environment
    if (isPlatformBrowser(this.platformId)) {
      (window as any).tokenService = tokenService;
    }
  }
  
  ngOnInit(): void {
    // Initialize token refresh system only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.tokenService.initTokenRefresh();
      console.log('[App] Token refresh system initialized');
      
      // Attempt to validate and refresh token on application start
      this.checkAuthAndRedirect();
    } else {
      console.log('[App] Running in SSR mode, token refresh not initialized');
    }
  }
  
  /**
   * Check authentication status and redirect to dashboard if authenticated via token refresh
   */
  private checkAuthAndRedirect(): void {
    // Log auth token and refresh token existence
    const hasAuthToken = !!localStorage.getItem('authToken');
    const hasRefreshToken = !!localStorage.getItem('refreshToken');
    
    console.log('[App] Initial authentication check - Auth token exists:', hasAuthToken);
    console.log('[App] Initial authentication check - Refresh token exists:', hasRefreshToken);
    
    if (!hasAuthToken && hasRefreshToken) {
      console.log('[App] No auth token but refresh token exists - attempting refresh');
      
      // Try to get a new auth token using the refresh token
      this.tokenService.refreshToken().then(success => {
        if (success) {
          console.log('[App] Token refreshed successfully, redirecting to dashboard');
          
          // If we're already on the sign-in or sign-up page and refresh was successful,
          // redirect to dashboard
          const currentUrl = this.router.url;
          if (currentUrl === '/sign-in' || currentUrl === '/sign-up' || currentUrl === '/') {
            this.router.navigate(['/dashboard']);
          }
        } else {
          console.log('[App] Token refresh failed, staying on current page');
        }
      }).catch(error => {
        console.error('[App] Error during token refresh:', error);
      });
    }
  }
}
