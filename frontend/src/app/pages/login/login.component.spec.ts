import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values and validators', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('email')?.hasError('required')).toBe(true);
    expect(component.loginForm.get('password')?.hasError('required')).toBe(true);
  });

  it('should redirect to dashboard if already authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    component.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should not redirect if not authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    component.ngOnInit();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    
    passwordControl?.setValue('123');
    expect(passwordControl?.hasError('minlength')).toBe(true);
    
    passwordControl?.setValue('123456');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should submit form successfully', () => {
    const loginResponse = { 
      success: true, 
      message: 'Login successful',
      data: {
        token: 'test-token', 
        user: { id: '1', email: 'test@example.com', createdAt: '2023-01-01T00:00:00Z' }
      }
    };
    mockAuthService.login.and.returnValue(of(loginResponse));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.isLoading).toBe(false);
  });

  it('should handle login error', () => {
    const errorResponse = { error: { error: 'Invalid credentials' } };
    mockAuthService.login.and.returnValue(throwError(() => errorResponse));

    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.isLoading).toBe(false);
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should not submit if form is invalid', () => {
    component.loginForm.patchValue({
      email: 'invalid-email',
      password: '123'
    });

    component.onSubmit();

    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(component.loginForm.touched).toBe(true);
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBe(false);
    
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(true);
    
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(false);
  });

  it('should detect invalid fields correctly', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.markAsTouched();
    
    expect(component.isFieldInvalid('email')).toBe(true);
    
    emailControl?.setValue('valid@email.com');
    expect(component.isFieldInvalid('email')).toBe(false);
  });

  it('should return correct error messages', () => {
    const emailControl = component.loginForm.get('email');
    const passwordControl = component.loginForm.get('password');
    
    emailControl?.markAsTouched();
    passwordControl?.markAsTouched();
    
    expect(component.getFieldError('email')).toBe('Email is required');
    expect(component.getFieldError('password')).toBe('Password is required');
    
    emailControl?.setValue('invalid-email');
    expect(component.getFieldError('email')).toBe('Please enter a valid email address');
    
    passwordControl?.setValue('123');
    expect(component.getFieldError('password')).toBe('Password must be at least 6 characters');
  });
});
