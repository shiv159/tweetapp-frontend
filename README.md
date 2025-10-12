# TweetApp Frontend

Production-ready Angular client for the TweetApp backend. The UI is built with standalone components, Angular signals for state, and strict TypeScript typing. It covers authentication, feed browsing, posting, likes, comments, and toast notifications.

## Prerequisites

- Node.js 18+
- npm 9+
- Running TweetApp backend (defaults to `http://localhost:8080`)

## Install & Configure

```bash
npm install
```

Configure the backend URL if it differs from the default by updating `src/environments/environment.ts`.

## Run the App

```bash
npm start
```

The dev server runs on `http://localhost:4200/` with hot reload. API requests are proxied through the configured `apiBaseUrl` and include JWT tokens via an HTTP interceptor.

## Build for Production

```bash
npm run build
```

Artifacts are emitted to `dist/` and optimized with Angular's production settings.

## Test

```bash
npm test
```

Unit tests cover services, guards, and key pages using Angular's testing utilities.

## Project Highlights

- Standalone components with `ChangeDetectionStrategy.OnPush`
- Reactive forms for login, registration, and post composition
- Signal-based state management with computed derivations
- Route guards and HTTP interceptor for JWT auth flows
- Toast system for success and error feedback
- Native template control flow (`@if`, `@for`) and accessible markup

## Notable Structure

- `src/app/core` – services (auth, posts, token storage, toast) and utilities
- `src/app/components` – reusable UI (composer, post card, comments, toast)
- `src/app/pages` – feature pages (feed, post detail, login, register, not-found)
- `src/app/app.routes.ts` – lazy-loaded feature routes and guards

## Backend Contract

The client expects TweetApp endpoints that match the models defined in `src/app/models`. Responses should wrap data in the shared `ApiResponse<T>` shape. Adjust models/services if the backend contract changes.
