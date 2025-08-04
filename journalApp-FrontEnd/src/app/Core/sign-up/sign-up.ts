import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/service/auth-service';
import { Router } from '@angular/router';
import { NavigationService } from '../../shared/service/navigation.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrls: ['./sign-up.css']
})
export class SignUp {
  user = {
    username: '',
    password: '',
    confirmPassword: ''
  };
  
  errorMessage: string = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private navigationService: NavigationService
  ) {}
  
  onSubmit(): void {
    // Check if passwords match
    if (this.user.password !== this.user.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
    
    this.authService.signUp(this.user.username, this.user.password)
      .subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          // Navigate to sign-in page after successful registration
          this.navigationService.navigateToSignIn();
        },
        error: (error) => {
          console.error('Registration error', error);
          if (error.status === 409) {
            this.errorMessage = 'Username already exists';
          } else {
            this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          }
        }
      });
  }
  
  goToLogin(): void {
    this.navigationService.navigateToSignIn();
  }
}
