import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { TokenService } from '../service/token-service';

/**
 * Guard for public routes like sign-in and sign-up
 * Redirects to dashboard if user is already authenticated
 */
export const publicRouteGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const router = inject(Router);
  
  console.log('Public Route Guard - Checking authentication');
  
  // If user is already authenticated via regular check, redirect to dashboard
  if (authService.isAuthenticated()) {
    console.log('Public Route Guard - User already authenticated, redirecting to dashboard');
    router.navigate(['/dashboard']);
    return false;
  }
  
  console.log('Public Route Guard - Not authenticated via regular check, trying token validation and refresh');
  
  // If not authenticated via regular check, try token validation/refresh
  try {
    const isValid = await tokenService.validateTokenAndRefresh();
    if (isValid) {
      console.log('Public Route Guard - Authentication refreshed successfully, redirecting to dashboard');
      router.navigate(['/dashboard']);
      return false;
    }
  } catch (error) {
    console.error('Public Route Guard - Error during token validation and refresh:', error);
  }
  
  // Allow access to public route for unauthenticated users
  console.log('Public Route Guard - User is not authenticated, access granted to public route');
  return true;
};
