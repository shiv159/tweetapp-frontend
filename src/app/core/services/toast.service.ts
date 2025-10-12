import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastPayload {
  id: number;
  message: string;
  kind: ToastKind;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  #autoIncrement = 0;
  readonly toasts = signal<ToastPayload[]>([]);

  constructor() {}

  success(message: string, duration = 4000): void {
    this.push('success', message, duration);
  }

  error(message: string, duration = 5000): void {
    this.push('error', message, duration);
  }

  info(message: string, duration = 4000): void {
    this.push('info', message, duration);
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastKind, message: string, duration: number): void {
    this.#autoIncrement += 1;
    const toast: ToastPayload = {
      id: this.#autoIncrement,
      message,
      kind,
      duration
    };

    this.toasts.update((current) => [...current, toast]);

    if (duration > 0) {
      window.setTimeout(() => this.dismiss(toast.id), duration);
    }
  }
}
