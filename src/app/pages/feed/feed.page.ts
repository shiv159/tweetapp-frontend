import { ChangeDetectionStrategy, Component, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, take } from 'rxjs/operators';

import { ApiResponseService } from '../../core/services/api-response.service';
import { AuthService } from '../../core/services/auth.service';
import { PostService } from '../../core/services/post.service';
import { ToastService } from '../../core/services/toast.service';
import { Post } from '../../models/post';
import { PostComposerComponent } from '../../components/post-composer/post-composer.component';
import { PostCardComponent } from '../../components/post-card/post-card.component';

@Component({
  selector: 'app-feed-page',
  imports: [PostComposerComponent, PostCardComponent],
  templateUrl: './feed.page.html',
  styleUrl: './feed.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedPageComponent {
  @ViewChild(PostComposerComponent) private composer?: PostComposerComponent;

  private readonly postService = inject(PostService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly apiResponseService = inject(ApiResponseService);

  protected readonly posts = signal<Post[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly composerPending = signal(false);

  private readonly likePending = signal<Record<string, boolean>>({});
  private readonly commentPending = signal<Record<string, boolean>>({});
  private readonly commentErrors = signal<Record<string, string | null>>({});

  private readonly currentUserSignal = toSignal(this.authService.currentUser$, { initialValue: null });
  private readonly tokenSignal = toSignal(this.authService.token$, { initialValue: null });
  protected readonly currentUserId = computed(() => this.currentUserSignal()?.userId ?? null);
  protected readonly canInteract = computed(() => this.tokenSignal() !== null);

  constructor() {
    this.loadPosts();
  }

  protected trackByPostId = (_: number, post: Post) => post.postId;

  protected isLikePending(postId: string): boolean {
    return Boolean(this.likePending()[postId]);
  }

  protected isCommentPending(postId: string): boolean {
    return Boolean(this.commentPending()[postId]);
  }

  protected commentError(postId: string): string | null {
    return this.commentErrors()[postId] ?? null;
  }

  protected onComposerSubmit(content: string): void {
    if (!content.trim()) {
      return;
    }

    this.composerPending.set(true);

    this.postService
      .create({ content })
      .pipe(
        finalize(() => this.composerPending.set(false))
      )
      .subscribe({
        next: (response) => {
          const post = response.data;
          if (post) {
            this.posts.update((current) => [post, ...current]);
            this.toastService.success('Post published.');
            this.composer?.reset();
            return;
          }

          const message = this.apiResponseService.getErrorMessage(response, 'Unable to publish post.');
          this.toastService.error(message);
        },
        error: () => {
          this.toastService.error('Unable to reach server. Please try again.');
        }
      });
  }

  protected onToggleLike(postId: string): void {
    const user = this.currentUserSignal();
    if (!user) {
      this.toastService.info('Sign in to like posts.');
      return;
    }

    const snapshot = clonePosts(this.posts());
    const updated = snapshot.map((post) => {
      if (post.postId !== postId) {
        return post;
      }

      const hasLiked = post.likes.some((like) => like.userId === user.userId);
      const likes = hasLiked
        ? post.likes.filter((like) => like.userId !== user.userId)
        : [...post.likes, { userId: user.userId, username: user.username }];

      return { ...post, likes };
    });

    this.posts.set(updated);
    this.likePending.update((current) => ({ ...current, [postId]: true }));

    this.postService
      .toggleLike(postId)
      .pipe(finalize(() => this.likePending.update((current) => ({ ...current, [postId]: false }))))
      .subscribe({
        next: () => {
          this.refreshPost(postId);
        },
        error: () => {
          this.posts.set(snapshot);
          this.toastService.error('Unable to update like. Please try again.');
        }
      });
  }

  protected onCommentSubmit(payload: { postId: string; content: string }): void {
    const user = this.currentUserSignal();
    if (!user) {
      this.toastService.info('Sign in to comment.');
      return;
    }

    this.commentPending.update((current) => ({ ...current, [payload.postId]: true }));
    this.commentErrors.update((current) => ({ ...current, [payload.postId]: null }));

    this.postService
      .addComment(payload.postId, { content: payload.content })
      .pipe(finalize(() => this.commentPending.update((current) => ({ ...current, [payload.postId]: false }))))
      .subscribe({
        next: (response) => {
          if (response.data !== null) {
            this.refreshPost(payload.postId);
            this.toastService.success('Comment added.');
            return;
          }

          const message = this.apiResponseService.getErrorMessage(response, 'Unable to add comment.');
          this.commentErrors.update((current) => ({ ...current, [payload.postId]: message }));
        },
        error: () => {
          this.commentErrors.update((current) => ({ ...current, [payload.postId]: 'Unable to reach server.' }));
        }
      });
  }

  protected retry(): void {
    this.loadPosts();
  }

  private loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.postService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (Array.isArray(response.data)) {
            const sorted = [...response.data].sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            this.posts.set(sorted);
            return;
          }

          const message = this.apiResponseService.getErrorMessage(response, 'Unable to load feed.');
          this.errorMessage.set(message);
        },
        error: () => {
          this.errorMessage.set('Unable to reach server. Please try again.');
        }
      });
  }

  private refreshPost(postId: string): void {
    this.postService
      .getById(postId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const updatedPost = response.data;
          if (!updatedPost) {
            return;
          }

          this.posts.update((posts) =>
            posts.map((post) => (post.postId === postId ? updatedPost : post))
          );
        }
      });
  }
}

function clonePosts(posts: Post[]): Post[] {
  return posts.map((post) => ({
    ...post,
    likes: [...post.likes],
    comments: [...post.comments]
  }));
}
