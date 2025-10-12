import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api-response';
import { Post } from '../../models/post';

@Injectable({ providedIn: 'root' })
export class PostService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Post[]>> {
    return this.http.get<ApiResponse<Post[]>>(`${environment.apiBaseUrl}/api/posts`);
  }

  getById(id: string): Observable<ApiResponse<Post>> {
    return this.http.get<ApiResponse<Post>>(`${environment.apiBaseUrl}/api/posts/${id}`);
  }

  create(request: { content: string }): Observable<ApiResponse<Post>> {
    return this.http.post<ApiResponse<Post>>(`${environment.apiBaseUrl}/api/posts`, request);
  }

  toggleLike(id: string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${environment.apiBaseUrl}/api/posts/${id}/like`, {});
  }

  addComment(id: string, request: { content: string }): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${environment.apiBaseUrl}/api/posts/${id}/comment`, request);
  }
}
