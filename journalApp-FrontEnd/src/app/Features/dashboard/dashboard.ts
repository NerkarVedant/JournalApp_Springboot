import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalService, JournalEntry, DashboardData } from '../../shared/service/journal.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from '../../shared/service/auth-service';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, OnDestroy {
  journalEntries: JournalEntry[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  audioUrls: Map<string, SafeUrl> = new Map<string, SafeUrl>();
  notification: { message: string, isSuccess: boolean } | null = null;

  constructor(
    private journalService: JournalService, 
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient // <-- Add this line to inject HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.notification = null;
    
    // Clean up existing audio URLs before loading new data to prevent memory leaks
    this.cleanupAudioUrls();
    
    this.journalService.getDashboardData()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges(); // Ensure the view updates after loading
        })
      )
      .subscribe({
        next: (data: DashboardData) => {
          this.journalEntries = data.journalEntries;
          console.log('Dashboard data loaded successfully:', this.journalEntries);
          
          // Debug: Check the first entry's structure and ID
          if (this.journalEntries.length > 0) {
            const sample = this.journalEntries[0];
          }
          
          // Process audio files
          this.journalEntries.forEach(entry => {
            if (entry.audioFile) {
              this.createAudioUrl(entry);
            }
          });
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

  /**
   * Converts binary audio data to a playable URL
   */
  createAudioUrl(entry: JournalEntry): void {
    if (!entry.audioFile) return;
    
    try {
      // Add entry ID to log for debugging
      console.log(`Creating audio URL for entry ID: ${entry.objectId}`);
      console.log(`Audio file data type: ${typeof entry.audioFile}`);
      
      // Create a unique key for this entry's audio
      const audioKey = `audio-${entry.objectId}`;
      
      // Check if it's already a URL
      if (typeof entry.audioFile === 'string') {
        if (entry.audioFile.startsWith('http') || entry.audioFile.startsWith('blob:')) {
          console.log(`Setting URL type audio for entry ${entry.objectId}`);
          this.audioUrls.set(audioKey, this.sanitizer.bypassSecurityTrustUrl(entry.audioFile));
          return;
        }
        
        // If it's a base64 data URL
        if (entry.audioFile.startsWith('data:audio')) {
          console.log(`Setting base64 audio for entry ${entry.objectId}`);
          this.audioUrls.set(audioKey, this.sanitizer.bypassSecurityTrustUrl(entry.audioFile));
          return;
        }
      }
      
      // If it's binary data (convert to base64 first if needed)
      const base64Data = this.ensureBase64Format(entry.audioFile);
      const blob = this.base64toBlob(base64Data, 'audio/mpeg');
      const url = URL.createObjectURL(blob);
      
      console.log(`Created blob URL for entry ${entry.objectId}: ${url}`);
      this.audioUrls.set(audioKey, this.sanitizer.bypassSecurityTrustUrl(url));
    } catch (e) {
      console.error(`Error creating audio URL for entry ${entry.objectId}:`, e);
    }
  }
  
  /**
   * Ensures that audio data is in base64 format
   */
  private ensureBase64Format(data: any): string {
    if (!data) return '';
    
    // If already base64 string
    if (typeof data === 'string') {
      // Remove potential data URL prefix
      if (data.includes('base64,')) {
        return data.split('base64,')[1];
      }
      return data;
    }
    
    // If it's an array buffer or similar binary data
    if (data instanceof ArrayBuffer) {
      return this.arrayBufferToBase64(data);
    }
    
    // If it's a Uint8Array
    if (data instanceof Uint8Array) {
      const buffer = data.buffer;
      return this.arrayBufferToBase64(buffer);
    }
    
    // If it's an object with binary data
    if (typeof data === 'object') {
      // Try to get a sensible string representation
      try {
        return JSON.stringify(data);
      } catch (e) {
        console.error('Cannot convert object to string:', e);
        return '';
      }
    }
    
    return '';
  }
  
  /**
   * Converts ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }
  
  /**
   * Converts base64 data to Blob
   */
  private base64toBlob(base64Data: string, contentType: string): Blob {
    contentType = contentType || '';
    
    // Ensure we have clean base64 without data URL prefix
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }
    
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      const begin = sliceIndex * sliceSize;
      const end = Math.min(begin + sliceSize, bytesLength);

      const bytes = new Array(end - begin);
      for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters.charCodeAt(offset);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    
    return new Blob(byteArrays, { type: contentType });
  }
  
  /**
   * Gets the safe URL for an audio file
   */
  getAudioUrl(entryId: string): SafeUrl {
    const audioKey = `audio-${entryId}`;
    const url = this.audioUrls.get(audioKey);
    
    console.log(`Getting audio URL for entry ${entryId}, found: ${url ? 'yes' : 'no'}`);
    return url || '';
  }

  /**
   * Logs out the user by clearing authentication data and redirecting to sign-in
   */
  logout(): void {
    console.log('Logging out user...');
    this.authService.logout();
    console.log('Authentication data cleared');
    
    // Navigate to the sign-in page
    this.router.navigate(['/sign-in']);
  }
  
  /**
   * Validates if a string could be a valid ID
   */
  private isValidObjectId(id: any): boolean {
    // Basic check - just ensure we have a non-empty value
    return id !== undefined && id !== null && id !== '';
  }

  /**
   * Validates if a string could be a valid ID
   * More permissive than strict MongoDB validation
   */

  /**
   * Safe method to handle deletion with proper validation
   * @param entry The journal entry or ID to delete
   */
  safeDeleteEntry(entry: any): void {
    // Clear any existing notifications
    this.notification = null;
    this.errorMessage = '';

    console.log('safeDeleteEntry called with entry:', entry);

    if (!entry) {
      this.notification = {
        message: 'Error: No entry to delete',
        isSuccess: false
      };
      return;
    }
    
    // Extract the objectId and title
    let objectId: string = '';
    let entryTitle: string = 'this journal entry';
    
    try {
      // Debug log to see exact entry structure
      console.log('Entry type:', typeof entry);
      console.log('Entry JSON:', JSON.stringify(entry));
      
      // Handle different entry formats
      if (typeof entry === 'string') {
        // If entry is already a string ID
        objectId = entry;
      } else if (typeof entry === 'object' && entry !== null) {
        // If entry is an object with objectId property
        if (entry.objectId !== undefined) {
          if (typeof entry.objectId === 'string') {
            objectId = entry.objectId;
          } else if (typeof entry.objectId === 'object' && entry.objectId !== null) {
            // If it's a MongoDB ObjectId object, convert to string
            objectId = JSON.stringify(entry.objectId);
          } else {
            objectId = String(entry.objectId);
          }
        } 
        // Try alternative ID fields if objectId isn't available
        else if (entry._id !== undefined) {
          objectId = String(entry._id);
        } else if (entry.id !== undefined) {
          objectId = String(entry.id);
        }
        
        // Get title if available
        if (entry.title) {
          entryTitle = entry.title;
        }
      }
      
      // Final check to ensure we have an ID
      if (!objectId) {
        throw new Error('Could not extract a valid ID from the entry');
      }
      
      // Clean up audio URL for this entry before deletion
      const audioKey = `audio-${objectId}`;
      if (this.audioUrls.has(audioKey)) {
        console.log(`Cleaning up audio URL for entry ${objectId}`);
        const url = this.audioUrls.get(audioKey);
        if (url) {
          try {
            // Extract the raw URL from SafeUrl if necessary
            let rawUrl: string = '';
            
            if (typeof url === 'string') {
              rawUrl = url;
            } else {
              // For SafeUrl objects, convert to string and check if it contains a blob URL
              const urlString = String(url);
              if (urlString.includes('blob:')) {
                // Try to extract the blob URL using regex
                const match = urlString.match(/blob:[^'")\s]+/);
                if (match && match[0]) {
                  rawUrl = match[0];
                }
              } else {
                rawUrl = urlString;
              }
            }
            
            // Revoke the blob URL to free up memory
            if (rawUrl.startsWith('blob:')) {
              console.log(`Revoking blob URL: ${rawUrl}`);
              URL.revokeObjectURL(rawUrl);
            }
          } catch (e) {
            console.error('Error revoking URL:', e);
          }
        }
        this.audioUrls.delete(audioKey);
      }
      
    } catch (error) {
      console.error('Error extracting entry ID:', error);
      this.notification = {
        message: 'Cannot delete: Invalid entry format',
        isSuccess: false
      };
      return;
    }
    
    console.log('Extracted objectId for deletion:', objectId);
    
    // Confirmation with entry title
    const confirmMessage = `Are you sure you want to delete "${entryTitle}"? This action cannot be undone.`;
    
    // Proceed with confirmation and deletion
    this.deleteEntry(objectId, confirmMessage);
  }

  /**
   * Deletes a journal entry after confirmation
   * @param objectId The object ID of the entry to delete
   * @param confirmMessage Custom confirmation message
   */
  deleteEntry(objectId: string, confirmMessage?: string): void {
    // Basic validation
    if (!objectId) {
      this.notification = {
        message: 'Cannot delete: No ID provided',
        isSuccess: false
      };
      return;
    }
    
    // Ask for confirmation before deleting
    if (confirm(confirmMessage || 'Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      // Show loading state for this operation
      this.isLoading = true;
      this.errorMessage = '';
      this.notification = null;
      
      try {
        // Extract the actual MongoDB ID value from whatever format we have
        let idToSend: string = objectId;
        
        if (objectId.includes('"timestamp"')) {
          // This is likely a stringified MongoDB ObjectId object
          try {
            const objIdObj = JSON.parse(objectId);
            if (objIdObj && objIdObj.timestamp) {
              // For MongoDB format with timestamp, extract the timestamp
              idToSend = String(objIdObj.timestamp);
            }
          } catch (parseError) {
            console.error('Error parsing object ID:', parseError);
            // Continue with original ID if parsing fails
          }
        }
        
        // Clean the ID (remove quotes, braces, etc.)
        idToSend = idToSend.replace(/['"{}]/g, '');
        
        // Log the ID format to debug
        console.log(`Attempting to delete entry with ID:`, objectId);
        console.log(`Extracted and cleaned ID for API call:`, idToSend);
        
        // Call the service to delete the entry
        this.journalService.deleteJournalEntry(idToSend)
          .pipe(
            finalize(() => {
              this.isLoading = false;
              this.cdr.detectChanges();
              
              // Auto-hide notification after 5 seconds
              if (this.notification?.isSuccess) {
                setTimeout(() => {
                  this.notification = null;
                  this.cdr.detectChanges();
                }, 5000);
              }
            })
          )
          .subscribe({
            next: (response) => {
              // Response is now a string like "Entry Deleted"
              console.log('Delete response:', response);
              
              this.loadDashboardData();
              
              console.log(`After deletion: ${this.journalEntries.length} entries remaining`);
              
              // Show success notification
              this.notification = {
                message: 'Journal entry deleted successfully!',
                isSuccess: true
              };
            },
            error: (error) => {
              console.error('Delete error:', error);
              
              // Show error notification
              const errorMsg = error.error?.message || error.message || 'Unknown error';
              
              this.errorMessage = `Failed to delete journal entry: ${errorMsg}`;
              this.notification = {
                message: `Failed to delete journal entry: ${errorMsg}`,
                isSuccess: false
              };
              
              if (error.status === 401 || error.status === 403) {
                this.notification = {
                  message: 'Your session has expired. Please login again.',
                  isSuccess: false
                };
              }
            }
          });
      } catch (error) {
        console.error('Error processing ID for deletion:', error);
        this.notification = {
          message: 'Error processing entry ID for deletion',
          isSuccess: false
        };
        this.isLoading = false;
      }
    }
  }
  
  /**
   * Navigates to the new journal entry page
   */
  navigateToNewEntry(): void {
    this.router.navigate(['/journal-entry']);
  }
  
  /**
   * Cleans up all audio URLs to prevent memory leaks
   */
  cleanupAudioUrls(): void {
    if (!this.audioUrls || this.audioUrls.size === 0) {
      return;
    }
    
    console.log(`Cleaning up ${this.audioUrls.size} audio URLs`);
    
    // Clean up each URL by revoking it if it's a blob URL
    this.audioUrls.forEach((url, key) => {
      try {
        // Extract the raw URL from SafeUrl if necessary
        let rawUrl: string = '';
        
        if (typeof url === 'string') {
          rawUrl = url;
        } else {
          // For SafeUrl objects, convert to string and check if it contains a blob URL
          const urlString = String(url);
          if (urlString.includes('blob:')) {
            // Try to extract the blob URL using regex
            const match = urlString.match(/blob:[^'")\s]+/);
            if (match && match[0]) {
              rawUrl = match[0];
            }
          } else {
            rawUrl = urlString;
          }
        }
        
        // Revoke the blob URL to free up memory
        if (rawUrl.startsWith('blob:')) {
          console.log(`Revoking blob URL: ${rawUrl}`);
          URL.revokeObjectURL(rawUrl);
        }
      } catch (e) {
        console.error(`Error revoking URL for key ${key}:`, e);
      }
    });
    
    // Clear the map
    this.audioUrls.clear();
  }
  
  /**
   * Clean up resources when component is destroyed
   */
  ngOnDestroy(): void {
    // Clean up all audio URLs when the component is destroyed
    this.cleanupAudioUrls();
  }
}
