import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-header',
    imports: [RouterLink],
    template: `
    <header class="header">
      <div class="header__container">
        <div class="header__brand">TweetApp</div>
        <nav class="header__nav" aria-label="Main navigation">
          <a routerLink="/feed" class="header__tab" routerLinkActive="header__tab--active">Feed</a>
          <a routerLink="/profile" class="header__tab" routerLinkActive="header__tab--active">Profile</a>
          <a routerLink="/search" class="header__tab" routerLinkActive="header__tab--active">Search User</a>
         <button type="button" class="header__tab" style="background-color: black;" (click)="logout()">Logout</button>
        </nav>
      </div>
    </header>
  `,
    styleUrl: './header.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
    readonly authservice = inject(AuthService);
    readonly router = inject(Router);

    logout() {
        this.authservice.logout();
        this.router.navigate(['/login']);
    }
}
