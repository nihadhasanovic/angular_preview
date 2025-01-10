import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClipService {
  private apiUrl = 'https://glrocfyez5hrzatsqtr57hsezu.appsync-api.us-east-1.amazonaws.com/graphql';
  private apiKey = 'da2-gahlqp3xkrh7fkajuqd54lghsa'; 

  constructor(private http: HttpClient) {}

  /**
   * Fetch clip object by ID from AppSync
   * @param id The ID of the clip
   * @returns An Observable with the clip data
   */
  getClipById(id: string): Observable<any> {
    const query = `
      query MyQuery($id: ID!) {
        getClip(id: $id) {
          media {
            hlsPath
            thumbnailPath
          }
        }
      }
    `;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    });

    const body = {
      query,
      variables: {
        id,
      },
    };

    return this.http.post(this.apiUrl, body, { headers });
  }
}

