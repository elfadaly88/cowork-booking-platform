import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Workspace, WorkspaceSchedulePeriod } from '../models/workspace.model';

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
   * GET /workspaces/available → get available workspaces with rooms that have seats
   */
  getAvailableWorkspaces(): Observable<Workspace[]> {
    const url = `${this.baseUrl}/workspaces/available`;
    return this.http.get<Workspace[]>(url).pipe(
      catchError((err) => {
        const message = err?.error?.message || 'Failed to load available workspaces';
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

  /**
   * GET /workspaces/{id}/schedule → get active schedule period for workspace
   */
  getActiveSchedule(id: number): Observable<WorkspaceSchedulePeriod> {
    const url = `${this.baseUrl}/workspaces/${id}/schedule`;
    return this.http.get<WorkspaceSchedulePeriod>(url).pipe(
      catchError((err) => {
        const message = err?.error?.message || `Failed to load schedule for workspace ${id}`;
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * POST /workspaces/{id}/schedule → add or replace schedule period
   */
  addOrReplaceSchedule(id: number, period: WorkspaceSchedulePeriod): Observable<WorkspaceSchedulePeriod> {
    const url = `${this.baseUrl}/workspaces/${id}/schedule`;
    return this.http.post<WorkspaceSchedulePeriod>(url, period).pipe(
      catchError((err) => {
        const message = err?.error?.message || 'Failed to save schedule';
        return throwError(() => new Error(message));
      })
    );
  }
}
