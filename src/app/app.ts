import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly authService = inject(AuthService);
  protected readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  protected readonly token = toSignal(this.authService.token$, { initialValue: null });
  protected readonly isAuthenticated = computed(() => this.token() !== null);

  protected logout(): void {
    this.authService.logout();
  }
}
