import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { ApiResponse } from '../../models/api-response';
import { Post } from '../../models/post';
import { MOCK_POSTS } from './mock-data';

// Simple in-memory store for mock posts
let postsStore: Post[] = MOCK_POSTS.map((p) => ({ ...p, likes: [...p.likes], comments: [...p.comments] }));

const NETWORK_DELAY = 300; // ms

@Injectable({ providedIn: 'root' })
export class MockPostService {
  getAll(): Observable<ApiResponse<Post[]>> {
    return of({ data: postsStore, error: null, message: 'OK' }).pipe(delay(NETWORK_DELAY));
  }

  getById(id: string): Observable<ApiResponse<Post>> {
    const found = postsStore.find((p) => p.postId === id) ?? null;
    return of({ data: found, error: null, message: found ? 'OK' : 'Not found' }).pipe(delay(NETWORK_DELAY));
  }

  create(request: { content: string }): Observable<ApiResponse<Post>> {
    const newPost: Post = {
      postId: `post-${Date.now()}`,
      userId: 'bob',
      content: request.content,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };
    postsStore = [newPost, ...postsStore];
    return of({ data: newPost, error: null, message: 'Created' }).pipe(delay(NETWORK_DELAY));
  }

  toggleLike(id: string): Observable<ApiResponse<string>> {
    // Toggle like for bob (mock current user)
    const userId = 'bob';
    const post = postsStore.find((p) => p.postId === id);
    if (!post) {
      return of({ data: null, error: 'Not found', message: 'Post not found' } as ApiResponse<string>).pipe(delay(NETWORK_DELAY));
    }

    const idx = post.likes.findIndex((l) => l.userId === userId);
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push({ userId, username: 'bob' });
    }

    return of({ data: 'ok', error: null, message: 'Toggled' }).pipe(delay(NETWORK_DELAY));
  }

  addComment(id: string, request: { content: string }): Observable<ApiResponse<string>> {
    const post = postsStore.find((p) => p.postId === id);
    if (!post) {
      return of({ data: null, error: 'Not found', message: 'Post not found' } as ApiResponse<string>).pipe(delay(NETWORK_DELAY));
    }

    post.comments.push({
      userId: 'bob',
      username: 'bob',
      content: request.content,
      createdAt: new Date().toISOString()
    });

    return of({ data: 'ok', error: null, message: 'Comment added' }).pipe(delay(NETWORK_DELAY));
  }
}
