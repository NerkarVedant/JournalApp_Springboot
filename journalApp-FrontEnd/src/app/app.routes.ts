import { Routes } from '@angular/router';
import { authGuard, publicRouteGuard } from './shared/guards/index';

export const routes: Routes = [
  // Default route - redirect to dashboard if authenticated, otherwise to login
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  
  // Protected routes - require authentication
  {
    path: 'dashboard',
    loadComponent: () => import('./Features/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [authGuard],
    title: 'Journal Dashboard'
  },
  {
    path: 'journal-entry',
    loadComponent: () => import('./Features/journal-entry/journal-entry').then(m => m.JournalEntry),
    canActivate: [authGuard],
    title: 'New Journal Entry'
  },
  
  // Public routes - accessible without authentication
  // Will redirect to dashboard if user is already logged in
  {
    path: 'sign-in',
    loadComponent: () => import('./Core/sign-in/sign-in').then(m => m.SignIn),
    canActivate: [publicRouteGuard],
    title: 'Sign In'
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./Core/sign-up/sign-up').then(m => m.SignUp),
    canActivate: [publicRouteGuard],
    title: 'Sign Up'
  },
  
  // Fallback route for any unmatched routes
  {
    path: '**',
    redirectTo: '/sign-in'
  }
];
