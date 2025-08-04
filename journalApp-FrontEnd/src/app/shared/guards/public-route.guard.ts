import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth-service';

/**
 * Guard for public routes like sign-in and sign-up
 * Redirects to dashboard if user is already authenticated
 */
export const publicRouteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log('Public Route Guard - Checking authentication');
  
  // If user is already authenticated, redirect to dashboard
  if (authService.isAuthenticated()) {
    console.log('Public Route Guard - User already authenticated, redirecting to dashboard');
    router.navigate(['/dashboard']);
    return false;
  }
  
  // Allow access to public route for unauthenticated users
  console.log('Public Route Guard - Access granted to public route');
  return true;
};
