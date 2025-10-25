import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalService {

  private currentLocale = signal(navigator.language || 'en-US');

  setLocale(locale: string): void {
    this.currentLocale.set(locale);
  }
  getLocale(): string {
    return this.currentLocale();
  }

}
