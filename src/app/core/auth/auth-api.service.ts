import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { AuthSession, LoginRequest, RegisterRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private readonly api: ApiService) {}

  login(request: LoginRequest): Observable<AuthSession> {
    return this.api.post<AuthSession>('/auth/login', request);
  }

  register(request: RegisterRequest): Observable<AuthSession> {
    return this.api.post<AuthSession>('/auth/register', request);
  }

  me(): Observable<AuthSession> {
    return this.api.get<AuthSession>('/auth/me');
  }
}
