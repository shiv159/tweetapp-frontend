import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-center',
  imports: [],
  template: `
    @if (toasts().length > 0) {
      <section class="toast-container" role="status" aria-live="assertive" aria-atomic="true">
        @for (toast of toasts(); track toast.id) {
          <div
            class="toast"
            [class.toast--success]="toast.kind === 'success'"
            [class.toast--error]="toast.kind === 'error'"
            [class.toast--info]="toast.kind === 'info'"
          >
            <p>{{ toast.message }}</p>
            <button type="button" class="toast__close" (click)="dismiss(toast.id)" aria-label="Dismiss notification">
              ✕
            </button>
          </div>
        }
      </section>
    }
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        inset-block-start: 1rem;
        inset-inline: 0;
        display: grid;
        gap: 0.75rem;
        justify-content: center;
        padding-inline: 1rem;
        z-index: 1000;
      }

      .toast {
        min-width: min(32rem, 90vw);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        background-color: #1f2937;
        color: #f9fafb;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
        transition: transform 0.2s ease, opacity 0.2s ease;
      }

      .toast p {
        margin: 0;
        font-size: 0.95rem;
      }

      .toast--success {
        background-color: #065f46;
      }

      .toast--error {
        background-color: #7f1d1d;
      }

      .toast--info {
        background-color: #1e3a8a;
      }

      .toast__close {
        inline-size: 1.75rem;
        block-size: 1.75rem;
        border-radius: 999px;
        border: none;
        color: inherit;
        background: transparent;
        cursor: pointer;
        font-size: 1.1rem;
        line-height: 1;
        display: grid;
        place-items: center;
        transition: background-color 0.2s ease;
      }

      .toast__close:hover,
      .toast__close:focus-visible {
        background-color: rgba(15, 23, 42, 0.2);
        outline: none;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  // Computed state - Gets toasts from service
  readonly toasts = computed(() => this.toastService.toasts());

  constructor(private readonly toastService: ToastService) {}

  /** Dismiss a toast notification */
  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
