import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginResponse,
  MessageResponse,
  RegisterApplicantData,
  SessionUser,
} from '../models/auth.model';

const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private url = `${environment.apiUrl}/auth`;

  currentUser = signal<SessionUser | null>(this.readStoredUser());

  constructor() {
    window.addEventListener('storage', () => this.syncWithOtherTabs());
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.url}/login`, { email: email, password: password })
      .pipe(tap((response) => this.saveSession(response)));
  }

  registerApplicant(data: RegisterApplicantData): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.url}/register/applicant`, data);
  }

  registerCompany(data: FormData): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.url}/register/company`, data);
  }

  verifyOtp(email: string, code: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.url}/verify-otp`, { email: email, code: code });
  }

  resendOtp(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.url}/resend-otp`, { email: email });
  }

  changeEmail(email: string, password: string, newEmail: string): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.url}/change-email`, {
      email: email,
      password: password,
      newEmail: newEmail,
    });
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.url}/forgot-password`, { email: email });
  }

  resetPassword(token: string, newPassword: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.url}/reset-password`, {
      token: token,
      newPassword: newPassword,
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(`${this.url}/change-password`, {
      currentPassword: currentPassword,
      newPassword: newPassword,
    });
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user !== null && user.role === role;
  }

  homeForRole(role: string): string {
    if (role === 'POSTULANTE') {
      return '/applicant';
    }
    if (role === 'EMPRESA') {
      return '/company';
    }
    if (role === 'SUPERADMIN') {
      return '/admin';
    }
    return '/';
  }

  logout(): void {
    this.clearSession();
    this.router.navigateByUrl('/');
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  // Cerrar sesión en una pestaña también la cierra en las demás del mismo navegador
  private syncWithOtherTabs(): void {
    const wasLoggedIn = this.currentUser() !== null;
    const user = this.readStoredUser();
    this.currentUser.set(user);
    if (wasLoggedIn && !user) {
      this.router.navigate(['/login'], {
        state: { message: 'Tu sesión se cerró en otra pestaña. Vuelve a iniciar sesión.' },
      });
    }
  }

  private saveSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  private readStoredUser(): SessionUser | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored || !localStorage.getItem(TOKEN_KEY)) {
      return null;
    }
    try {
      return JSON.parse(stored) as SessionUser;
    } catch {
      return null;
    }
  }
}
