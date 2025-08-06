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
    id: '',
    title: '',
    content: '',
    date: new Date().toISOString(),
    audioFile: null
  };
  
  isSubmitting: boolean = false;
  notification: { message: string, isSuccess: boolean } | null = null;
  isEditMode: boolean = false;
  entryId: string = '';

  constructor(
    private journalService: JournalService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.queryParams.subscribe(params => {
      console.log('Route query params:', params);
      
      if (params['mode'] === 'edit' && params['id']) {
        console.log('Edit mode detected with ID:', params['id']);
        this.isEditMode = true;
        this.entryId = params['id'];
        this.loadEntryForEdit(this.entryId);
      } else {
        console.log('Create mode detected');
        // Initialize a new entry with the current date
        this.isEditMode = false;
        this.journalEntry.date = new Date().toISOString();
      }
    });
  }

  loadEntryForEdit(entryId: string): void {
    console.log('Attempting to load entry for edit with ID:', entryId);
    this.journalService.getJournalEntryById(entryId)
      .subscribe({
        next: (entry) => {
          console.log('Loaded entry for edit:', entry);
          console.log('Entry title:', entry.title);
          console.log('Entry content:', entry.content);
          
          // Short delay before patching the form (can help with UI update issues)
          setTimeout(() => {
            // Patch the form with the loaded entry data
            this.journalEntry = { 
              id: entry.id || entryId,
              title: entry.title || '',
              content: entry.content || '',
              date: entry.date || new Date().toISOString(),
              audioFile: entry.audioFile || null
            };
            
            console.log('Form patched with delay:', this.journalEntry);
          }, 100); // Small delay to ensure UI updates
        },
        error: (error) => {
          console.error('Error loading entry for edit:', error);
          console.error('Error status:', error.status);
          console.error('Error response:', error.error);
          this.notification = {
            message: 'Failed to load entry for editing: ' + (error.error?.message || error.message || 'Unknown error'),
            isSuccess: false
          };
          // Redirect back to dashboard on error
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        }
      });
  }

  saveJournalEntry(): void {
    if (!this.journalEntry.title || !this.journalEntry.content) {
      this.notification = {
        message: 'Please fill in all required fields',
        isSuccess: false
      };
      return;
    }

    // Ask for confirmation before saving/updating
    const confirmMessage = this.isEditMode 
      ? `Are you sure you want to update "${this.journalEntry.title}"?`
      : `Are you sure you want to save "${this.journalEntry.title}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.isSubmitting = true;
    this.notification = null;

    if (this.isEditMode) {
      // Update existing entry
      this.journalService.updateJournalEntry(this.entryId, this.journalEntry)
        .pipe(
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Journal entry update response:', response);
            
            // Check if the response indicates success
            const isSuccess = response && (response.success === true || response.status === 200);
            
            this.notification = {
              message: isSuccess 
                ? 'Journal entry updated successfully!' 
                : ('Update failed: ' + (response?.message || 'Unknown error')),
              isSuccess: isSuccess
            };
            
            // Only navigate back on success
            if (isSuccess) {
              // Navigate back to dashboard after 1 second
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 1000);
            }
          },
          error: (error) => {
            console.error('Error updating journal entry:', error);
            
            // Special case: if status is 200 but we still got an error, treat as success
            if (error.status === 200) {
              console.log('Treating 200 status error as success');
              this.notification = {
                message: 'Journal entry updated successfully!',
                isSuccess: true
              };
              
              // Navigate back to dashboard after 1 second
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 1000);
              return;
            }
            
            // Normal error handling
            this.notification = {
              message: 'Failed to update journal entry: ' + (error.error?.message || error.message || 'Unknown error'),
              isSuccess: false
            };
          }
        });
    } else {
      // Create new entry
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
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
