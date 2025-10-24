import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Workspace } from '../models/workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * GET /workspaces → get all workspaces
   */
  getWorkspaces(): Observable<Workspace[]> {
    const url = `${this.baseUrl}/workspaces`;
    return this.http.get<Workspace[]>(url).pipe(
      catchError((err) => {
        const message = err?.error?.message || 'Failed to load workspaces';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * GET /workspaces/{id} → get workspace details including rooms/devices
   */
  getWorkspaceById(id: number): Observable<Workspace> {
    const url = `${this.baseUrl}/workspaces/${id}`;
    return this.http.get<Workspace>(url).pipe(
      catchError((err) => {
        const message = err?.error?.message || `Failed to load workspace ${id}`;
        return throwError(() => new Error(message));
      })
    );
  }
}
