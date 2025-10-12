import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ApiResponse } from '../../models/api-response';
import { ApiResponseService } from '../../core/services/api-response.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LoginPageComponent } from './login.page';

class AuthServiceStub {
	login = jasmine.createSpy('login');
}

class ToastServiceStub {
	success = jasmine.createSpy('success');
	error = jasmine.createSpy('error');
	info = jasmine.createSpy('info');
}

describe('LoginPageComponent', () => {
	let fixture: ComponentFixture<LoginPageComponent>;
	let component: LoginPageComponent;
	let authService: AuthServiceStub;
	let router: Router;

	beforeEach(async () => {
		authService = new AuthServiceStub();

		await TestBed.configureTestingModule({
			imports: [LoginPageComponent, RouterTestingModule],
			providers: [
				{ provide: AuthService, useValue: authService },
				{ provide: ToastService, useClass: ToastServiceStub },
				ApiResponseService,
				{
					provide: ActivatedRoute,
					useValue: { snapshot: { queryParamMap: convertToParamMap({}) } }
				}
			]
		}).compileComponents();

		router = TestBed.inject(Router);
		fixture = TestBed.createComponent(LoginPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('does not submit when the form is invalid', () => {
		(component as unknown as { onSubmit(): void }).onSubmit();

		expect(authService.login).not.toHaveBeenCalled();
	});

	it('navigates to the feed on successful login', () => {
		authService.login.and.returnValue(of<ApiResponse<string>>({ data: 'token', error: null, message: 'OK' }));
		const routerSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);

		const form = (component as unknown as { form: { setValue(values: { username: string; password: string }): void } }).form;
		form.setValue({ username: 'alice', password: 'secret123' });

		(component as unknown as { onSubmit(): void }).onSubmit();

		expect(authService.login).toHaveBeenCalledWith({ username: 'alice', password: 'secret123' });
		expect(routerSpy).toHaveBeenCalledWith('/feed');
	});
});
