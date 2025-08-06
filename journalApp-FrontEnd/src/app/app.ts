import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
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
    } else {
      console.log('[App] Running in SSR mode, token refresh not initialized');
    }
  }
}
