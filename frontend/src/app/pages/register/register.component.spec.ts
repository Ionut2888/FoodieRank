import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values and validators', () => {
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
    expect(component.registerForm.get('email')?.hasError('required')).toBe(true);
    expect(component.registerForm.get('password')?.hasError('required')).toBe(true);
  });

  it('should validate email format', () => {
    const emailControl = component.registerForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.registerForm.get('password');
    
    passwordControl?.setValue('123');
    expect(passwordControl?.hasError('minlength')).toBe(true);
    
    passwordControl?.setValue('123456');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should validate password match', () => {
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'different'
    });
    
    expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
  });

  it('should submit form successfully', fakeAsync(() => {
    const registerResponse = { 
      success: true, 
      message: 'Registration successful',
      data: {
        user: { id: '1', email: 'test@example.com', createdAt: '2023-01-01T00:00:00Z' }
      }
    };
    mockAuthService.register.and.returnValue(of(registerResponse));

    component.registerForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(mockAuthService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(component.successMessage).toBe('Account created successfully! Redirecting to login...');
    expect(component.isLoading).toBe(false);

    tick(2000);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle registration error', () => {
    const errorResponse = { error: { error: 'Email already exists' } };
    mockAuthService.register.and.returnValue(throwError(() => errorResponse));

    component.registerForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Email already exists');
    expect(component.isLoading).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    component.registerForm.patchValue({
      email: 'invalid-email',
      password: '123',
      confirmPassword: 'different'
    });

    component.onSubmit();

    expect(mockAuthService.register).not.toHaveBeenCalled();
    expect(component.registerForm.touched).toBe(true);
  });

  it('should detect invalid fields correctly', () => {
    const emailControl = component.registerForm.get('email');
    emailControl?.markAsTouched();
    
    expect(component.isFieldInvalid('email')).toBe(true);
    
    emailControl?.setValue('valid@email.com');
    expect(component.isFieldInvalid('email')).toBe(false);
  });

  it('should return correct error messages', () => {
    const emailControl = component.registerForm.get('email');
    const passwordControl = component.registerForm.get('password');
    
    emailControl?.markAsTouched();
    passwordControl?.markAsTouched();
    
    expect(component.getFieldError('email')).toBe('Email is required');
    expect(component.getFieldError('password')).toBe('Password is required');
    
    emailControl?.setValue('invalid-email');
    expect(component.getFieldError('email')).toBe('Please enter a valid email address');
    
    passwordControl?.setValue('123');
    expect(component.getFieldError('password')).toBe('Password must be at least 6 characters');
  });

  it('should return password mismatch error', () => {
    component.registerForm.patchValue({
      password: 'password123',
      confirmPassword: 'different'
    });
    
    const confirmPasswordControl = component.registerForm.get('confirmPassword');
    confirmPasswordControl?.markAsTouched();
    
    expect(component.getFieldError('confirmPassword')).toBe('Passwords do not match');
  });

  it('should reset form after successful registration', fakeAsync(() => {
    const registerResponse = { 
      success: true, 
      message: 'Registration successful',
      data: {
        user: { id: '1', email: 'test@example.com', createdAt: '2023-01-01T00:00:00Z' }
      }
    };
    mockAuthService.register.and.returnValue(of(registerResponse));

    component.registerForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
  }));
});
