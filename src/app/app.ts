import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './core/services/auth.service';
import { HeaderComponent } from "./components/header/header.component";
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  // Services
  private readonly authService = inject(AuthService);
  
  // Convert Observable streams to Signals
  protected readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  protected readonly token = toSignal(this.authService.token$, { initialValue: null });  
  // Computed state - Check if user is authenticated
  protected readonly isAuthenticated = computed<boolean>(() => {
    return environment.useMockApi ? true : this.token() !== null;
  });

}
