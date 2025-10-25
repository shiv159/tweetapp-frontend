import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { ApiResponse } from '../../models/api-response';
import { User } from '../../models/user';
import { MOCK_USERS } from './mock-data';

const NETWORK_DELAY = 250; // ms

@Injectable({ providedIn: 'root' })
export class MockUserService {
  /**
   * Mocked user search.
   * - Case-insensitive substring match on username
   * - Trims input
   * - Returns empty list for queries shorter than 2 chars
   * - Simulates network latency
   */
  search(query: string): Observable<ApiResponse<User[]>> {
    const q = (query ?? '').trim().toLowerCase();

    if (q.length < 2) {
      return of({ data: [], error: null, message: 'OK' }).pipe(delay(NETWORK_DELAY));
    }

    return of(MOCK_USERS).pipe(
      delay(NETWORK_DELAY),
      map((users) =>
        users.filter((u) => u.username.toLowerCase().includes(q))
      ),
      map((results) => ({ data: results, error: null, message: 'OK' } as ApiResponse<User[]>))
    );
  }
}
