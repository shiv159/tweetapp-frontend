import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocalService } from '../services/local-service';

@Pipe({
  name: 'timeAgoPipe'
})
export class TimeAgoPipePipe implements PipeTransform {

  private readonly localeService = inject(LocalService);

  transform(value: string | Date | number, options?: { locale?: string; style?: 'long' | 'short' | 'narrow'; fallback?: boolean }): string {
    // Handle null or invalid input
    if (!value) {
      return '';
    }

    // Convert input to Date object
    const date = this.toDate(value);
    if (!date || isNaN(date.getTime())) {
      return '';
    }

    // Get current time and calculate difference
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    // Define time units and their thresholds
    const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 },
    ];

    // Find the appropriate unit
    for (const { unit, seconds } of units) {
      const difference = diffInSeconds / seconds;
      if (Math.abs(difference) >= 1) {
        const formatter = new Intl.RelativeTimeFormat(this.localeService.getLocale(), {
          numeric: 'auto',
          style: 'long',
        });
        return formatter.format(Math.round(difference * -1), unit);
      }
    }

    // Fallback for very recent times
    return 'just now';
  }

  // Helper to convert input to Date
  private toDate(value: string | Date | number): Date | null {
    if (value instanceof Date) {
      return value;
    }
    return new Date(value);
  }

  // Method to get exact date for tooltip using Intl (no DI required)
  getExactDate(value: string | Date | number | null | undefined): string {
    if (!value) {
      return '';
    }
    const date = this.toDate(value);
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    const locale = this.localeService.getLocale() || 'en-US';
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }
}


