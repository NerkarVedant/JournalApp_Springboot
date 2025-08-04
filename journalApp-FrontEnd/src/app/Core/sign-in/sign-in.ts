import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../shared/service/auth-service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavigationService } from '../../shared/service/navigation.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './sign-in.html',
  styleUrls: ['./sign-in.css']
})
export class SignIn {
  loginCredentials = {
    username: '',
    password: ''
  };
  
  rememberMe = false;
  errorMessage: string = '';
  isLoading: boolean = true;
  platformId: Object;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private http: HttpClient,
    private navigationService: NavigationService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.platformId = platformId;
  }
  
  onSubmit(): void {
  this.errorMessage = '';
  this.isLoading = true; // Add loading state
  
  this.authService.loginUser(this.loginCredentials.username, this.loginCredentials.password)
    .subscribe({
      next: (response) => {
        this.isLoading = false;
        const token = this.authService.getAuthToken();

        if (response?.success && token) {
          // Set rememberMe only in browser
          if (isPlatformBrowser(this.platformId) && this.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
          // Ensure token is set before navigation
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Authentication error: Could not retrieve security token.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        // Your existing error handling is good
      }
    });
}
  
  goToSignUp(): void {
    this.navigationService.navigateToSignUp();
  }
}
