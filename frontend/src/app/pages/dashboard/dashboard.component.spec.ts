import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    createdAt: '2023-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: of(mockUser)
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with current user', () => {
    fixture.detectChanges();
    expect(component.currentUser).toEqual(mockUser);
  });

  it('should display user email in template', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('test@example.com');
  });

  it('should redirect to login when user is null', () => {
    // Reset the spy to return null user
    Object.defineProperty(mockAuthService, 'currentUser$', {
      value: of(null)
    });
    
    fixture.detectChanges();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should logout and navigate to login when logout is called', () => {
    component.logout();
    
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should format date correctly', () => {
    const testDate = '2023-01-01T00:00:00Z';
    const formattedDate = component.formatDate(testDate);
    
    expect(formattedDate).toBe('1/1/2023');
  });

  it('should return "Unknown" for undefined date', () => {
    const formattedDate = component.formatDate(undefined);
    
    expect(formattedDate).toBe('Unknown');
  });

  it('should display logout button', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector('.logout-btn');
    
    expect(logoutButton).toBeTruthy();
    expect(logoutButton?.textContent?.trim()).toBe('Logout');
  });

  it('should call logout method when logout button is clicked', () => {
    spyOn(component, 'logout');
    fixture.detectChanges();
    
    const logoutButton = fixture.nativeElement.querySelector('.logout-btn');
    logoutButton?.dispatchEvent(new Event('click'));
    
    expect(component.logout).toHaveBeenCalled();
  });
});
