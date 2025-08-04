import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(private router: Router) {}

  navigateToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }

  navigateToSignUp(): void {
    this.router.navigate(['/sign-up']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}
