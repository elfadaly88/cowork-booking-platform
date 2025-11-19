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
   * GET /workspaces/my-workspaces → get workspaces owned by the current user (Owner only)
   */
  getMyWorkspaces(): Observable<Workspace[]> {
    const url = `${this.baseUrl}/workspaces/my-workspaces`;
    return this.http.get<Workspace[]>(url).pipe(
      catchError((err) => {
        const message = err?.error?.message || 'Failed to load your workspaces';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * GET /workspaces/pending → get workspaces waiting for admin approval (Admin only)
   */
  getPendingWorkspaces(): Observable<Workspace[]> {
    const url = `${this.baseUrl}/workspaces/pending`;
    return this.http.get<Workspace[]>(url).pipe(
      catchError((err) => {
        const message = err?.error?.message || 'Failed to load pending workspaces';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * POST /workspaces/{id}/approve → approve a workspace (Admin only)
   */
  approveWorkspace(id: number): Observable<{ message: string }> {
    const url = `${this.baseUrl}/workspaces/${id}/approve`;
    return this.http.post<{ message: string }>(url, {}).pipe(
      catchError((err) => {
        const message = err?.error?.message || 'Failed to approve workspace';
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

  /**
   * POST /workspaces/with-rooms → create workspace with rooms and devices (Owner/Admin)
   */
  createWorkspaceWithRooms(workspace: any): Observable<Workspace> {
    const url = `${this.baseUrl}/workspaces/with-rooms`;
    return this.http.post<Workspace>(url, workspace).pipe(
      catchError((err) => {
        const message = err?.error?.message || 'Failed to create workspace';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Convenience wrapper: create workspace (alias for createWorkspaceWithRooms)
   */
  createWorkspace(workspace: any): Observable<Workspace> {
    return this.createWorkspaceWithRooms(workspace);
  }

  /**
   * PUT /workspaces/{id} → update an existing workspace
   */
  updateWorkspace(id: number, workspace: any): Observable<Workspace> {
    const url = `${this.baseUrl}/workspaces/${id}`;
    return this.http.put<Workspace>(url, workspace).pipe(
      catchError((err) => {
        const message = err?.error?.message || `Failed to update workspace ${id}`;
        return throwError(() => new Error(message));
      })
    );
  }
}
