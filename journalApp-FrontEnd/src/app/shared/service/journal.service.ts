import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface JournalEntry {
  objectId: string;
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
    return this.http.get<JournalEntry>(`${this.baseUrl}/journal/${entryId}`, { headers });
  }

  // Create a new journal entry
  createJournalEntry(entry: JournalEntry): Observable<JournalEntry> {
    const headers = this.getAuthHeaders();
    return this.http.post<JournalEntry>(`${this.baseUrl}/journal`, entry, { headers });
  }

  // Update an existing journal entry
  updateJournalEntry(entry: JournalEntry): Observable<JournalEntry> {
    const headers = this.getAuthHeaders();
    return this.http.put<JournalEntry>(`${this.baseUrl}/journal/${entry.objectId}`, entry, { headers });
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
