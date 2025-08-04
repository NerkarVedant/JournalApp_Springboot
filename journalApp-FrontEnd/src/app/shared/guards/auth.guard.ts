import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  console.log('Auth Guard - Checking authentication');
  
  // Only try to access localStorage in browser environments
  if (isPlatformBrowser(platformId)) {
    console.log('Token exists:', !!localStorage.getItem('authToken'));
    
    // For debugging purposes, log the token without revealing sensitive parts
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   console.log('Token length:', token.length);
    //   console.log('Token starts with:', token.substring(0, 10) + '...');
    // }
  }
  
  // Check authentication
  const isAuth = authService.isAuthenticated();
  console.log('Is authenticated:', isAuth);
  
  if (isAuth) {
    console.log('Auth Guard - Access granted to protected route');
    return true;
  }

  // Proper authentication enforcement
  console.log('Auth Guard - Authentication check failed, redirecting to login page');
  router.navigate(['/sign-in']);
  return false;
};