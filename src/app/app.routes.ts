import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'feed'
	},
	{
		path: 'login',
		// Lazy-load the standalone component to reduce initial bundle size
		loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPageComponent)
		//,canActivate: [guestGuard]
	},
	{
		path: 'register',
		// Lazy-load register page
		loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPageComponent)
		//,canActivate: [guestGuard]
	},
	{
		path: 'feed',
		// Lazy-load feed page
		loadComponent: () => import('./pages/feed/feed.page').then(m => m.FeedPageComponent)
		//,canActivate: [authGuard]
	},
	{
		path: 'posts/:id',
		// Lazy-load post detail page
		loadComponent: () => import('./pages/post-detail/post-detail.page').then(m => m.PostDetailPageComponent)
		//,canActivate: [authGuard]
	},
	{
		path: 'profile',
		// Lazy-load profile page
		loadComponent: () => import('./pages/profile-page/profile-page').then(m => m.ProfilePage)
		//,canActivate: [authGuard]
	},
	{
		path:'search',
		loadComponent:() => import('./pages/search-page/search-page').then(m => m.SearchPage)
	},
	{
		path: '404',
		// Lazy-load not found page
		loadComponent: () => import('./pages/not-found/not-found.page').then(m => m.NotFoundPageComponent)
	},
	{
		path: '**',
		redirectTo: '404'
	}
];
