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
  hasEntries: boolean = false;

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
    this.hasEntries = false; // Reset hasEntries flag before loading
    
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
          
          // Set hasEntries flag based on whether there are journal entries
          this.hasEntries = this.journalEntries && this.journalEntries.length > 0;
          console.log('Has entries:', this.hasEntries);
          
          // Debug: Check the first entry's structure and ID
          if (this.journalEntries.length > 0) {
            const sample = this.journalEntries[0];
            console.log('Sample entry structure:', sample);
            console.log('Available ID fields:', {
              id: sample.id,
              objectId: sample.objectId,
              _id: (sample as any)._id
            });
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
          
          // Reset entries flag on error
          this.hasEntries = false;
          
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
      // Extract a valid ID for this entry
      let entryId: string = '';
      
      // Try different ID fields that might be available
      // Prioritize 'id' since that's what the backend DTO sends
      if (entry.id) {
        entryId = String(entry.id);
      } else if (entry.objectId) {
        entryId = String(entry.objectId);
      } else if ((entry as any)._id) {
        entryId = String((entry as any)._id);
      } else {
        // If no ID is found, create a unique ID based on entry content and date
        const contentHash = entry.title + entry.content + entry.date;
        entryId = btoa(contentHash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
        console.warn(`No ID found for entry, using generated ID: ${entryId}`);
      }
      
      // Add entry ID to log for debugging
      console.log(`Creating audio URL for entry ID: ${entryId}`);
      console.log(`Entry title: ${entry.title}`);
      console.log(`Audio file data type: ${typeof entry.audioFile}`);
      console.log(`Audio file data length/size:`, 
        Array.isArray(entry.audioFile) ? entry.audioFile.length : 
        typeof entry.audioFile === 'string' ? entry.audioFile.length :
        entry.audioFile instanceof ArrayBuffer ? entry.audioFile.byteLength :
        'unknown'
      );
      
      // Create a unique key for this entry's audio
      const audioKey = `audio-${entryId}`;
      
      // Check if we already have a URL for this entry
      if (this.audioUrls.has(audioKey)) {
        console.log(`Audio URL already exists for entry ${entryId}, skipping creation`);
        return;
      }
      
      // Check if it's already a URL
      if (typeof entry.audioFile === 'string') {
        if (entry.audioFile.startsWith('http') || entry.audioFile.startsWith('blob:')) {
          console.log(`Setting URL type audio for entry ${entryId}`);
          this.audioUrls.set(audioKey, this.sanitizer.bypassSecurityTrustUrl(entry.audioFile));
          return;
        }
        
        // If it's a base64 data URL
        if (entry.audioFile.startsWith('data:audio')) {
          console.log(`Setting base64 audio for entry ${entryId}`);
          this.audioUrls.set(audioKey, this.sanitizer.bypassSecurityTrustUrl(entry.audioFile));
          return;
        }
      }
      
      // If it's binary data (convert to base64 first if needed)
      const base64Data = this.ensureBase64Format(entry.audioFile);
      
      if (!base64Data) {
        console.error(`No valid base64 data extracted for entry ${entryId}`);
        return;
      }
      
      console.log(`Base64 data length for entry ${entryId}: ${base64Data.length}`);
      console.log(`Base64 data preview for entry ${entryId}: ${base64Data.substring(0, 50)}...`);
      
      const blob = this.base64toBlob(base64Data, 'audio/mpeg');
      const url = URL.createObjectURL(blob);
      
      console.log(`Created blob URL for entry ${entryId}: ${url}`);
      console.log(`Blob size for entry ${entryId}: ${blob.size} bytes`);
      
      this.audioUrls.set(audioKey, this.sanitizer.bypassSecurityTrustUrl(url));
    } catch (e) {
      console.error(`Error creating audio URL for entry:`, e);
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
    
    // If it's an array of numbers (byte array from Spring Boot)
    if (Array.isArray(data)) {
      console.log('Converting array of bytes to base64');
      try {
        // Convert array of bytes to Uint8Array, then to base64
        const uint8Array = new Uint8Array(data);
        return this.arrayBufferToBase64(uint8Array.buffer);
      } catch (e) {
        console.error('Error converting byte array:', e);
        return '';
      }
    }
    
    // If it's an object with binary data (like MongoDB binary format)
    if (typeof data === 'object') {
      // Check if it's a MongoDB Binary object format
      if (data.type === 'Buffer' && Array.isArray(data.data)) {
        console.log('Converting Buffer object to base64');
        try {
          const uint8Array = new Uint8Array(data.data);
          return this.arrayBufferToBase64(uint8Array.buffer);
        } catch (e) {
          console.error('Error converting Buffer object:', e);
          return '';
        }
      }
      
      // Check if it has a 'data' property with byte array
      if (data.data && Array.isArray(data.data)) {
        console.log('Converting data property array to base64');
        try {
          const uint8Array = new Uint8Array(data.data);
          return this.arrayBufferToBase64(uint8Array.buffer);
        } catch (e) {
          console.error('Error converting data array:', e);
          return '';
        }
      }
      
      // Try to get a sensible string representation as fallback
      try {
        const jsonString = JSON.stringify(data);
        console.warn('Converting object to JSON string as fallback:', jsonString.substring(0, 100) + '...');
        return jsonString;
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
    
    if (!base64Data) {
      console.error('Empty base64 data provided to base64toBlob');
      return new Blob([], { type: contentType });
    }
    
    // Ensure we have clean base64 without data URL prefix
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1];
    }
    
    // Remove any whitespace or newlines
    base64Data = base64Data.replace(/\s/g, '');
    
    try {
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
      
      const blob = new Blob(byteArrays, { type: contentType });
      console.log(`Created blob with size: ${blob.size} bytes, type: ${contentType}`);
      return blob;
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      console.error('Base64 data length:', base64Data.length);
      console.error('Base64 data preview:', base64Data.substring(0, 100));
      return new Blob([], { type: contentType });
    }
  }
  
  /**
   * Gets the safe URL for an audio file
   */
  getAudioUrl(entryId: string): SafeUrl {
    // If the entryId is undefined or empty, try to find it from the current entries
    if (!entryId || entryId === 'undefined') {
      console.warn('getAudioUrl called with undefined entryId, returning empty URL');
      return '';
    }
    
    const audioKey = `audio-${entryId}`;
    const url = this.audioUrls.get(audioKey);
    
    console.log(`Getting audio URL for entry ${entryId}, found: ${url ? 'yes' : 'no'}`);
    return url || '';
  }
  
  /**
   * Helper method to extract ID from a journal entry
   */
  getEntryId(entry: any): string {
    if (!entry) return '';
    
    // Try different ID fields that might be available
    // Prioritize 'id' since that's what the backend DTO sends
    if (entry.id) {
      return String(entry.id);
    } else if (entry.objectId) {
      return String(entry.objectId);
    } else if (entry._id) {
      return String(entry._id);
    } else {
      // If no ID is found, create a unique ID based on entry content and date
      const contentHash = entry.title + entry.content + entry.date;
      return btoa(contentHash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
    }
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
    
    // Extract the objectId and title using our helper method
    let objectId: string = '';
    let entryTitle: string = 'this journal entry';
    
    try {
      // Use our helper method to get the ID
      objectId = this.getEntryId(entry);
      
      // Get title if available
      if (typeof entry === 'object' && entry !== null && entry.title) {
        entryTitle = entry.title;
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
   * Navigates to the edit journal entry page
   */
  navigateToEditEntry(entry: any): void {
    console.log('Edit button clicked for entry:', entry);
    const entryId = this.getEntryId(entry);
    console.log('Extracted entry ID:', entryId);
    
    if (entryId) {
      console.log('Navigating to edit mode with ID:', entryId);
      this.router.navigate(['/journal-entry'], { 
        queryParams: { 
          id: entryId, 
          mode: 'edit' 
        } 
      });
    } else {
      console.error('Cannot edit entry: No valid ID found');
      this.notification = {
        message: 'Cannot edit entry: Invalid entry ID',
        isSuccess: false
      };
    }
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
