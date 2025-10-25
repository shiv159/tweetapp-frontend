import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-response';
import { Post } from '../../models/post';
import { MockPostService } from '../mocks/mock-post.service';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly mockService = inject(MockPostService);

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Post[]>> {
    if (environment.useMockApi) {
      return this.mockService.getAll();
    }
    return this.http.get<ApiResponse<Post[]>>(`${environment.apiBaseUrl}/api/posts`);
  }

  getById(id: string): Observable<ApiResponse<Post>> {
    if (environment.useMockApi) {
      return this.mockService.getById(id);
    }
    return this.http.get<ApiResponse<Post>>(`${environment.apiBaseUrl}/api/posts/${id}`);
  }

  create(request: { content: string }): Observable<ApiResponse<Post>> {
    if (environment.useMockApi) {
      return this.mockService.create(request);
    }
    return this.http.post<ApiResponse<Post>>(`${environment.apiBaseUrl}/api/posts`, request);
  }

  toggleLike(id: string): Observable<ApiResponse<string>> {
    if (environment.useMockApi) {
      return this.mockService.toggleLike(id);
    }
    return this.http.put<ApiResponse<string>>(`${environment.apiBaseUrl}/api/posts/${id}/like`, {});
  }

  addComment(id: string, request: { content: string }): Observable<ApiResponse<string>> {
    if (environment.useMockApi) {
      return this.mockService.addComment(id, request);
    }
    return this.http.post<ApiResponse<string>>(`${environment.apiBaseUrl}/api/posts/${id}/comment`, request);
  }
}
