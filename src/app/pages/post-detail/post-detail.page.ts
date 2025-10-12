import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs/operators';

import { ApiResponseService } from '../../core/services/api-response.service';
import { AuthService } from '../../core/services/auth.service';
import { PostService } from '../../core/services/post.service';
import { ToastService } from '../../core/services/toast.service';
import { Post } from '../../models/post';
import { PostCardComponent } from '../../components/post-card/post-card.component';

@Component({
  selector: 'app-post-detail-page',
  imports: [RouterLink, PostCardComponent],
  templateUrl: './post-detail.page.html',
  styleUrl: './post-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly postService = inject(PostService);
  private readonly toastService = inject(ToastService);
  private readonly apiResponseService = inject(ApiResponseService);
  private readonly authService = inject(AuthService);

  protected readonly post = signal<Post | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly likePending = signal(false);
  protected readonly commentPending = signal(false);
  protected readonly commentError = signal<string | null>(null);

  private readonly currentUserSignal = toSignal(this.authService.currentUser$, { initialValue: null });
  private readonly tokenSignal = toSignal(this.authService.token$, { initialValue: null });

  protected readonly currentUserId = computed(() => this.currentUserSignal()?.userId ?? null);
  protected readonly canInteract = computed(() => this.tokenSignal() !== null);

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        map((params) => params.get('id'))
      )
      .subscribe((postId) => {
        if (postId) {
          this.loadPost(postId);
        } else {
          this.errorMessage.set('Post not found.');
        }
      });
  }

  protected get postId(): string | null {
    return this.post()?.postId ?? null;
  }

  protected onToggleLike(postId: string): void {
    const user = this.authService.getCurrentUser();
    if (!user || this.likePending()) {
      if (!user) {
        this.toastService.info('Sign in to like posts.');
      }
      return;
    }

    const snapshot = this.post();
    if (!snapshot) {
      return;
    }

    const hasLiked = snapshot.likes.some((like) => like.userId === user.userId);
    const likes = hasLiked
      ? snapshot.likes.filter((like) => like.userId !== user.userId)
      : [...snapshot.likes, { userId: user.userId, username: user.username }];

    this.post.set({ ...snapshot, likes });
    this.likePending.set(true);

    this.postService
      .toggleLike(postId)
      .pipe(finalize(() => this.likePending.set(false)))
      .subscribe({
        next: () => this.refresh(postId),
        error: () => {
          this.post.set(snapshot);
          this.toastService.error('Unable to update like. Please try again.');
        }
      });
  }

  protected onCommentSubmit(payload: { postId: string; content: string }): void {
    const user = this.authService.getCurrentUser();
    if (!user || this.commentPending()) {
      if (!user) {
        this.toastService.info('Sign in to comment.');
      }
      return;
    }

    this.commentPending.set(true);
    this.commentError.set(null);

    this.postService
      .addComment(payload.postId, { content: payload.content })
      .pipe(finalize(() => this.commentPending.set(false)))
      .subscribe({
        next: (response) => {
          if (response.data !== null) {
            this.refresh(payload.postId);
            this.toastService.success('Comment added.');
            return;
          }

          const message = this.apiResponseService.getErrorMessage(response, 'Unable to add comment.');
          this.commentError.set(message);
        },
        error: () => {
          this.commentError.set('Unable to reach server.');
        }
      });
  }

  private loadPost(postId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.postService
      .getById(postId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const post = response.data;
          if (post) {
            this.post.set(post);
            return;
          }

          const message = this.apiResponseService.getErrorMessage(response, 'Post not found.');
          this.errorMessage.set(message);
          this.post.set(null);
        },
        error: () => {
          this.errorMessage.set('Unable to reach server.');
          this.post.set(null);
        }
      });
  }

  private refresh(postId: string): void {
    this.postService
      .getById(postId)
      .subscribe({
        next: (response) => {
          const refreshed = response.data;
          if (refreshed) {
            this.post.set(refreshed);
          }
        }
      });
  }
}
