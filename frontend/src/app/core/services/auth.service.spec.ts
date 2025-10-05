import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { RegisterRequest, LoginRequest, User, LoginResponse, AuthResponse } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    createdAt: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should register a new user', () => {
      const registerData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const expectedResponse: AuthResponse = {
        success: true,
        message: 'User registered successfully',
        data: { user: mockUser }
      };

      service.register(registerData).subscribe(response => {
        expect(response).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush(expectedResponse);
    });
  });

  describe('login', () => {
    it('should login user and set auth data', () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      const expectedResponse: LoginResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token: 'mock-jwt-token'
        }
      };

      service.login(loginData).subscribe(response => {
        expect(response).toEqual(expectedResponse);
        expect(service.getCurrentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:5000/api/v1/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(expectedResponse);
    });
  });

  describe('logout', () => {
    it('should clear auth data on logout', () => {
      // First set some auth data
      localStorage.setItem('foodierank_token', JSON.stringify({ token: 'test-token', timestamp: Date.now() }));
      localStorage.setItem('foodierank_user', JSON.stringify(mockUser));

      service.logout();

      expect(localStorage.getItem('foodierank_token')).toBeNull();
      expect(localStorage.getItem('foodierank_user')).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('token management', () => {
    it('should get token from localStorage', () => {
      const testToken = 'test-token';
      localStorage.setItem('foodierank_token', JSON.stringify({ token: testToken, timestamp: Date.now() }));

      expect(service.getToken()).toBe(testToken);
    });

    it('should return null if no token exists', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should handle backwards compatibility for old token format', () => {
      const testToken = 'old-format-token';
      localStorage.setItem('foodierank_token', testToken);

      expect(service.getToken()).toBe(testToken);
    });
  });

  describe('authentication state', () => {
    it('should return false for isAuthenticated when no token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return current user from storage', () => {
      localStorage.setItem('foodierank_user', JSON.stringify(mockUser));
      
      // Create new service instance to test initialization
      const newService = TestBed.inject(AuthService);
      expect(newService.getCurrentUser()).toEqual(mockUser);
    });

    it('should emit current user changes', (done) => {
      service.currentUser$.subscribe(user => {
        if (user) {
          expect(user).toEqual(mockUser);
          done();
        }
      });

      // Simulate login
      const loginResponse: LoginResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token: 'mock-token'
        }
      };

      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();

      const req = httpMock.expectOne('http://localhost:5000/api/v1/auth/login');
      req.flush(loginResponse);
    });

    it('should emit logged in state changes', (done) => {
      let emissionCount = 0;
      service.isLoggedIn$.subscribe(isLoggedIn => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(isLoggedIn).toBe(true);
          done();
        }
      });

      // Simulate login
      const loginResponse: LoginResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token: 'mock-token'
        }
      };

      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();

      const req = httpMock.expectOne('http://localhost:5000/api/v1/auth/login');
      req.flush(loginResponse);
    });
  });

  describe('token validation', () => {
    it('should validate JWT token expiration', () => {
      // Create a mock JWT with expiration in the future
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validPayload = { exp: futureExp };
      const validToken = 'header.' + btoa(JSON.stringify(validPayload)) + '.signature';
      
      localStorage.setItem('foodierank_token', JSON.stringify({ token: validToken, timestamp: Date.now() }));
      localStorage.setItem('foodierank_user', JSON.stringify(mockUser));
      
      // Create new service instance to test validation
      const newService = TestBed.inject(AuthService);
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should handle expired JWT tokens', () => {
      // Create a mock JWT with expiration in the past
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredPayload = { exp: pastExp };
      const expiredToken = 'header.' + btoa(JSON.stringify(expiredPayload)) + '.signature';
      
      localStorage.setItem('foodierank_token', JSON.stringify({ token: expiredToken, timestamp: Date.now() }));
      localStorage.setItem('foodierank_user', JSON.stringify(mockUser));
      
      // Create new service instance to test validation
      const newService = TestBed.inject(AuthService);
      expect(newService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('foodierank_token')).toBeNull();
    });

    it('should handle invalid JWT tokens', () => {
      const invalidToken = 'invalid.token.format';
      
      localStorage.setItem('foodierank_token', JSON.stringify({ token: invalidToken, timestamp: Date.now() }));
      localStorage.setItem('foodierank_user', JSON.stringify(mockUser));
      
      // Create new service instance to test validation
      const newService = TestBed.inject(AuthService);
      expect(newService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('foodierank_token')).toBeNull();
    });
  });
});
