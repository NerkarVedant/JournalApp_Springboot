import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalService, JournalEntry, DashboardData } from '../../shared/service/journal.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  journalEntries: JournalEntry[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private journalService: JournalService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.journalService.getDashboardData()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.errorMessage = '';
          this.cdr.detectChanges(); // Ensure the view updates after loading
        })
      )
      .subscribe({
        next: (data: DashboardData) => {
          this.journalEntries = data.journalEntries;
          console.log('Dashboard data loaded successfully:', this.journalEntries);
        },
        error: (error) => {
          console.error('Error fetching dashboard data:', error);
          this.errorMessage = 'Failed to load dashboard data. Please try again later.';
          
          if (error.status === 401 || error.status === 403) {
            this.errorMessage = 'Your session has expired. Please login again.';
            // Optionally redirect to login page
          }
        }
      });
  }

  getShortContent(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  isContentTruncated(content: string, maxLength: number = 200): boolean {
    return content.length > maxLength;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
