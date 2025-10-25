import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { environment } from '../../../environments/environment';
import { MockUserService } from '../mocks/mock-user.service';
import { User } from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly mockService = inject(MockUserService);

  constructor(private httpClient: HttpClient) { }

  // Search users by query (case-insensitive substring on username in mock mode)
  search(query: string): Observable<ApiResponse<User[]>> {
    if (environment.useMockApi) {
      return this.mockService.search(query);
    }
    const url = `${environment.apiBaseUrl}/api/users?query=${encodeURIComponent(query)}`;
    return this.httpClient.get<ApiResponse<User[]>>(url);
  }
}
