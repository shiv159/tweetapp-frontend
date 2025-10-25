import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocalService } from '../services/local-service';

@Pipe({
  name: 'exactDatePipe'
})
export class ExactDatePipePipe implements PipeTransform {

  private readonly localeService = inject(LocalService);
 //
  transform(value: string | Date | number, options?: { locale?: string; opts?: Intl.DateTimeFormatOptions }): string {
    if (!value) {
      return '';
    }
    const date = this.toDate(value);
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    const locale = options?.locale ?? this.localeService.getLocale() ?? 'en-US';
    const formatOpts: Intl.DateTimeFormatOptions = options?.opts ?? {
      dateStyle: 'medium',
      timeStyle: 'short'
    };
    return new Intl.DateTimeFormat(locale, formatOpts).format(date);
  }

  // Helper to convert input to Date
  private toDate(value: string | Date | number): Date | null {
    if (value instanceof Date) {
      return value;
    }
    return new Date(value);
  }

}


