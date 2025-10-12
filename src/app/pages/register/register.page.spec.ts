import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ApiResponse } from '../../models/api-response';
import { ApiResponseService } from '../../core/services/api-response.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RegisterPageComponent } from './register.page';

class AuthServiceStub {
  register = jasmine.createSpy('register');
}

class ToastServiceStub {
  success = jasmine.createSpy('success');
  error = jasmine.createSpy('error');
  info = jasmine.createSpy('info');
}

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let component: RegisterPageComponent;
  let authService: AuthServiceStub;
  let router: Router;

  beforeEach(async () => {
    authService = new AuthServiceStub();

    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useClass: ToastServiceStub },
        ApiResponseService
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RegisterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not submit when invalid', () => {
    (component as unknown as { onSubmit(): void }).onSubmit();

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('submits the registration form when valid', () => {
    authService.register.and.returnValue(of<ApiResponse<string>>({ data: 'Created', error: null, message: 'OK' }));
    const routerSpy = spyOn(router, 'navigate').and.resolveTo(true);

    const form = (component as unknown as {
      form: {
        setValue(values: {
          username: string;
          password: string;
          email: string;
          firstName: string;
          lastName: string;
          dateOfBirth: string;
        }): void;
      };
    }).form;

    form.setValue({
      username: 'alice123',
      password: 'strongPass',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Wonder',
      dateOfBirth: '1990-01-01'
    });

    (component as unknown as { onSubmit(): void }).onSubmit();

    expect(authService.register).toHaveBeenCalled();
    expect(routerSpy).toHaveBeenCalledWith(['/login']);
  });
});
