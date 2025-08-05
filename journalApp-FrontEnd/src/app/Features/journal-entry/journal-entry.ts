import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { JournalService, JournalEntry as JournalEntryModel } from '../../shared/service/journal.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-journal-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-entry.html',
  styleUrl: './journal-entry.css'
})
export class JournalEntry implements OnInit {
  journalEntry: JournalEntryModel = {
    objectId: '',
    title: '',
    content: '',
    date: new Date().toISOString(),
    audioFile: null
  };
  
  isSubmitting: boolean = false;
  notification: { message: string, isSuccess: boolean } | null = null;

  constructor(
    private journalService: JournalService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Initialize a new entry with the current date
    this.journalEntry.date = new Date().toISOString();
  }

  saveJournalEntry(): void {
    if (!this.journalEntry.title || !this.journalEntry.content) {
      this.notification = {
        message: 'Please fill in all required fields',
        isSuccess: false
      };
      return;
    }

    this.isSubmitting = true;
    this.notification = null;

    this.journalService.createJournalEntry(this.journalEntry)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: (savedEntry) => {
          console.log('Journal entry saved successfully:', savedEntry);
          this.notification = {
            message: 'Journal entry saved successfully!',
            isSuccess: true
          };
          
          // Navigate back to dashboard after 1 second
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1000);
        },
        error: (error) => {
          console.error('Error saving journal entry:', error);
          this.notification = {
            message: 'Failed to save journal entry: ' + (error.error?.message || error.message || 'Unknown error'),
            isSuccess: false
          };
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
