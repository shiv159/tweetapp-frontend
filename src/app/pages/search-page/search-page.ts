import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, finalize, map, switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-search-page',
  imports: [ReactiveFormsModule],
  templateUrl: './search-page.html',
  styleUrl: './search-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPage {
  // Services
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  // Form control (non-nullable)
  readonly searchControl = this.fb.nonNullable.control('', {
    validators: [Validators.minLength(2)]
  });

  // UI state as signals
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // ValueChanges -> results stream
  private readonly results$ = this.searchControl.valueChanges.pipe(
    map((q) => q.trim()),
    debounceTime(300),
    distinctUntilChanged(),
    tap(() => this.errorMessage.set(null)),
    filter((q) => q.length >= 2),
    tap(() => this.isLoading.set(true)),
    switchMap((query) =>
      this.userService
        .search(query)
        .pipe(
          map((res) => res.data ?? []),
          catchError(() => {
            this.errorMessage.set('Unable to search right now. Please try again.');
            return of([] as User[]);
          }),
          finalize(() => this.isLoading.set(false))
        )
    )
  );

  // Observable -> Signal
  readonly results = toSignal(this.results$, { initialValue: [] as User[] });

  // Derived
  readonly hasQuery = computed(() => this.searchControl.value.trim().length > 0);

  // Template helpers
  trackByUserId = (_: number, user: User) => user.userId;
}
