import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Post } from '../../models/post';
import { PostService } from './post.service';

describe('PostService', () => {
  let service: PostService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(PostService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('requests the feed', () => {
    const posts: Post[] = [];

    service.getAll().subscribe((response) => {
      expect(response.data).toBe(posts);
    });

    const request = http.expectOne(`${environment.apiBaseUrl}/api/posts`);
    request.flush({ data: posts, error: null, message: 'OK' });
  });

  it('creates a post', () => {
    const payload = { content: 'hello' };

    service.create(payload).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/api/posts`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
  });

  it('toggles a like', () => {
    service.toggleLike('abc').subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/api/posts/abc/like`);
    expect(request.request.method).toBe('PUT');
  });

  it('adds a comment', () => {
    const payload = { content: 'Nice post' };

    service.addComment('abc', payload).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/api/posts/abc/comment`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
  });
});
