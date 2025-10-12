import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

import { ApiResponseService } from '../../core/services/api-response.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly apiResponseService = inject(ApiResponseService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    dateOfBirth: ['', [Validators.required, Validators.pattern(DATE_REGEX)]]
  });

  protected readonly isSubmitting = signal(false);
  private readonly submitted = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly usernameError = computed(() => this.errorFor('username'));
  protected readonly passwordError = computed(() => this.errorFor('password'));
  protected readonly emailError = computed(() => this.errorFor('email'));
  protected readonly firstNameError = computed(() => this.errorFor('firstName'));
  protected readonly lastNameError = computed(() => this.errorFor('lastName'));
  protected readonly dobError = computed(() => this.errorFor('dateOfBirth'));

  protected onSubmit(): void {
    this.submitted.set(true);
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .register(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.data !== null) {
            this.toastService.success('Registration successful. You can now sign in.');
            void this.router.navigate(['/login']);
            return;
          }

          const message = this.apiResponseService.getErrorMessage(response, 'Unable to complete registration.');
          this.formError.set(message);
        },
        error: () => {
          this.formError.set('Unable to reach server. Please try again.');
        }
      });
  }

  private errorFor(controlName: 'username' | 'password' | 'email' | 'firstName' | 'lastName' | 'dateOfBirth'): string | null {
    const control = this.form.controls[controlName];
    if (!control.invalid || (!control.touched && !this.submitted())) {
      return null;
    }

    if (control.errors?.['required']) {
      return 'This field is required.';
    }

    if (control.errors?.['minlength']) {
      return `Minimum length is ${control.errors['minlength'].requiredLength} characters.`;
    }

    if (control.errors?.['maxlength']) {
      return `Maximum length is ${control.errors['maxlength'].requiredLength} characters.`;
    }

    if (control.errors?.['email']) {
      return 'Enter a valid email address.';
    }

    if (control.errors?.['pattern']) {
      return 'Use the YYYY-MM-DD format.';
    }

    return 'Invalid value.';
  }
}
