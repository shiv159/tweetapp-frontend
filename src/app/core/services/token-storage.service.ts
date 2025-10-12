import { Injectable } from '@angular/core';

const TOKEN_KEY = 'tweetapp-token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  #storage: Storage | undefined;

  constructor() {
    if (typeof window !== 'undefined') {
      this.#storage = window.localStorage;
    }
  }

  getToken(): string | null {
    return this.#storage?.getItem(TOKEN_KEY) ?? null;
  }

  setToken(token: string): void {
    this.#storage?.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    this.#storage?.removeItem(TOKEN_KEY);
  }

  hasToken(): boolean {
    return this.getToken() !== null;
  }
}
