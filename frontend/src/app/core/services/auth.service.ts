import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterRequest, AuthResponse, LoginRequest, LoginResponse, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/v1/auth';
  private readonly TOKEN_KEY = 'foodierank_token';
  private readonly USER_KEY = 'foodierank_user';
  
  // BehaviorSubject to track authentication state
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) { }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAuthData(response.data.token, response.data.user);
        }
      })
    );
  }

  logout(): void {
    this.clearAuthData();
  }

  // Token and user management with security enhancements
  private setAuthData(token: string, user: User): void {
    // Store with expiration check
    const tokenData = {
      token,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isLoggedInSubject.next(true);
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Simple JWT expiration check (decode without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp <= now) {
        this.clearAuthData(); // Auto-cleanup expired tokens
        return false;
      }
      
      return true;
    } catch {
      this.clearAuthData(); // Cleanup invalid tokens
      return false;
    }
  }

  getToken(): string | null {
    const tokenData = localStorage.getItem(this.TOKEN_KEY);
    if (!tokenData) return null;
    
    try {
      const parsed = JSON.parse(tokenData);
      return parsed.token || tokenData; // Backwards compatibility
    } catch {
      return tokenData; // Fallback for old format
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }
}
