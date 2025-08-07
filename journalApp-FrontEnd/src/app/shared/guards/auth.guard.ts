import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { TokenService } from '../service/token-service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  console.log('Auth Guard - Checking authentication');
  
  // Only try to access localStorage in browser environments
  if (isPlatformBrowser(platformId)) {
    console.log('JWT token exists:', !!localStorage.getItem('authToken'));
    console.log('Refresh token exists:', !!localStorage.getItem('refreshToken'));
  }
  
  // First check if already authenticated via regular means
  if (authService.isAuthenticated()) {
    console.log('Auth Guard - Already authenticated, access granted');
    return true;
  }
  
  console.log('Auth Guard - Not authenticated via regular check, trying token validation and refresh');
  
  // Try token validation and refresh if needed
  try {
    const isValid = await tokenService.validateTokenAndRefresh();
    if (isValid) {
      console.log('Auth Guard - Authentication refreshed successfully, access granted');
      return true;
    }
  } catch (error) {
    console.error('Auth Guard - Error during token validation and refresh:', error);
  }

  // Proper authentication enforcement
  console.log('Auth Guard - All authentication checks failed, redirecting to login page');
  router.navigate(['/sign-in']);
  return false;
};