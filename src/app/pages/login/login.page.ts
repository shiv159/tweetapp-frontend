import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { ApiResponseService } from '../../core/services/api-response.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly apiResponseService = inject(ApiResponseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  protected readonly isSubmitting = signal(false);
  private readonly submitted = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly returnUrl = signal<string | null>(null);

  constructor() {
    const initialReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.returnUrl.set(initialReturnUrl);
  }

  protected readonly usernameError = computed(() => this.shouldShowError('username'));
  protected readonly passwordError = computed(() => this.shouldShowError('password'));

  protected onSubmit(): void {
    this.submitted.set(true);
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.form.getRawValue();

    this.authService
      .login(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.toastService.success('Welcome back!');
            const target = this.returnUrl() ?? '/feed';
            void this.router.navigateByUrl(target);
            return;
          }

          const message = this.apiResponseService.getErrorMessage(response, 'Invalid username or password.');
          this.formError.set(message);
        },
        error: () => {
          this.formError.set('Unable to reach server. Please try again.');
        }
      });
  }

  private shouldShowError(controlName: 'username' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }
}
