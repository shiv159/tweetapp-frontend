import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { FeedPageComponent } from './pages/feed/feed.page';
import { LoginPageComponent } from './pages/login/login.page';
import { NotFoundPageComponent } from './pages/not-found/not-found.page';
import { PostDetailPageComponent } from './pages/post-detail/post-detail.page';
import { RegisterPageComponent } from './pages/register/register.page';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'feed'
	},
	{
		path: 'login',
		component: LoginPageComponent,
		canActivate: [guestGuard]
	},
	{
		path: 'register',
		component: RegisterPageComponent,
		canActivate: [guestGuard]
	},
	{
		path: 'feed',
		component: FeedPageComponent,
		canActivate: [authGuard]
	},
	{
		path: 'posts/:id',
		component: PostDetailPageComponent,
		canActivate: [authGuard]
	},
	{
		path: '404',
		component: NotFoundPageComponent
	},
	{
		path: '**',
		redirectTo: '404'
	}
];
