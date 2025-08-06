import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface JournalEntry {
  id: string;           // Changed from objectId to id to match backend DTO
  objectId?: string;    // Keep objectId as optional for backward compatibility
  date: string;
  title: string;
  content: string;
  audioFile: any;
}

export interface DashboardData {
  journalEntries: JournalEntry[];
}

@Injectable({
  providedIn: 'root'
})
export class JournalService {
  private baseUrl: string = 'http://localhost:8080';
  private tokenKey: string = 'authToken';

  constructor(private http: HttpClient) { }

  // Get authorization headers with JWT token
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.tokenKey);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all journal entries
  getJournalEntries(): Observable<JournalEntry[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<JournalEntry[]>(`${this.baseUrl}/journal`, { headers });
  }

  // Get single journal entry by ID
  getJournalEntryById(entryId: string): Observable<JournalEntry> {
    const headers = this.getAuthHeaders();
    return this.http.get<JournalEntry>(`${this.baseUrl}/journal/id/${entryId}`, { headers });
  }

  // Create a new journal entry
  createJournalEntry(entry: JournalEntry): Observable<JournalEntry> {
    const headers = this.getAuthHeaders();
    return this.http.post<JournalEntry>(`${this.baseUrl}/journal`, entry, { headers });
  }

  // Update an existing journal entry
  updateJournalEntry(entryId: string, entry: JournalEntry): Observable<any> {
    const headers = this.getAuthHeaders();
    // Remove the id from the entry object before sending to avoid conflicts
    const { id, ...entryWithoutId } = entry;
    
    // Use responseType: 'text' for endpoints that might return non-JSON responses
    return this.http.put(`${this.baseUrl}/journal/id/${entryId}`, entryWithoutId, { 
      headers, 
      responseType: 'text' 
    }).pipe(
      map(response => {
        // If the response is empty or just a success message, return a standardized object
        if (!response || typeof response === 'string') {
          // Create a new object with entry properties and additional success info
          const result = {
            ...entry,  // Include the original entry data
            success: true, 
            message: response || 'Update successful'
          };
          return result;
        }
        // If it's somehow already parsed JSON (shouldn't happen with responseType: 'text')
        return response;
      }),
      catchError(error => {
        console.error('Error in updateJournalEntry:', error);
        // If error status is 200, it's actually a success but with formatting issues
        if (error.status === 200) {
          console.log('Received 200 status code but treated as error, converting to success');
          // Create a new object with entry properties and additional success info
          const result = {
            ...entry,
            success: true, 
            message: 'Update successful despite response format issues'
          };
          return of(result);
        }
        return throwError(() => error);
      })
    );
  }

  // Delete a journal entry
  deleteJournalEntry(id: string): Observable<any> {
    console.log('deleteJournalEntry called with ID:', id);

    // Safety check
    if (!id) {
      console.error('Null or undefined ID passed to deleteJournalEntry');
      return throwError(() => new Error('No ID provided for deletion'));
    }
    
    // Ensure we have a clean string ID without quotes, braces, etc.
    const cleanId = String(id).replace(/['"{}]/g, '');
    console.log('Cleaned ID for API call:', cleanId);
    
    const headers = this.getAuthHeaders();
    const deleteUrl = `${this.baseUrl}/journal/id/${cleanId}`;
    
    console.log('DELETE request URL:', deleteUrl);
    
    // Use DELETE to match the @DeleteMapping on the backend
    // Set responseType to 'text' since the backend returns a string response
    return this.http.delete(deleteUrl, {
      headers,
      responseType: 'text'
    }).pipe(
      tap(response => console.log('Delete successful, response:', response)),
      catchError(error => {
        console.error('Delete request failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Get dashboard data (journal entries only)
  getDashboardData(): Observable<DashboardData> {
    return this.getJournalEntries().pipe(
      map(journalEntries => ({ journalEntries }))
    );
  }

  // Upload audio file
  uploadAudio(entryId: string, audioBlob: Blob): Observable<any> {
    const headers = this.getAuthHeaders();
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.mp3');

    return this.http.post(`${this.baseUrl}/journal/${entryId}/audio`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${localStorage.getItem(this.tokenKey)}`
      })
    });
  }
  
  // Helper method to get base URL
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
