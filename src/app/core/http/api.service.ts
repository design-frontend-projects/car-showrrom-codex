import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type QueryParams = HttpParams | Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(url: string): Observable<T>;
  get<T>(url: string, params: QueryParams): Observable<T>;
  get<T>(url: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.buildUrl(url), { params: normalizeParams(params) });
  }

  post<T>(url: string, body: unknown): Observable<T>;
  post<T>(url: string, body: unknown, params: QueryParams): Observable<T>;
  post<T>(url: string, body: unknown, params?: QueryParams): Observable<T> {
    return this.http.post<T>(this.buildUrl(url), body, { params: normalizeParams(params) });
  }

  put<T>(url: string, body: unknown): Observable<T>;
  put<T>(url: string, body: unknown, params: QueryParams): Observable<T>;
  put<T>(url: string, body: unknown, params?: QueryParams): Observable<T> {
    return this.http.put<T>(this.buildUrl(url), body, { params: normalizeParams(params) });
  }

  patch<T>(url: string, body: unknown): Observable<T>;
  patch<T>(url: string, body: unknown, params: QueryParams): Observable<T>;
  patch<T>(url: string, body: unknown, params?: QueryParams): Observable<T> {
    return this.http.patch<T>(this.buildUrl(url), body, { params: normalizeParams(params) });
  }

  delete<T>(url: string): Observable<T>;
  delete<T>(url: string, params: QueryParams): Observable<T>;
  delete<T>(url: string, params?: QueryParams): Observable<T> {
    return this.http.delete<T>(this.buildUrl(url), { params: normalizeParams(params) });
  }

  private buildUrl(url: string): string {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;

    return `${base}${path}`;
  }
}

function normalizeParams(params?: QueryParams): HttpParams | undefined {
  if (!params) {
    return undefined;
  }

  if (params instanceof HttpParams) {
    return params;
  }

  return Object.entries(params).reduce(
    (httpParams, [key, value]) => httpParams.set(key, String(value)),
    new HttpParams()
  );
}
