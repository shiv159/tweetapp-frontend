import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';

@Injectable({ providedIn: 'root' })
export class ApiResponseService {
  getErrorMessage<T>(response: ApiResponse<T>, fallback = 'An unexpected error occurred.'): string {
    if (response.error && response.error.trim().length > 0) {
      return response.error;
    }

    if (response.message && response.message.trim().length > 0) {
      return response.message;
    }

    return fallback;
  }
}
