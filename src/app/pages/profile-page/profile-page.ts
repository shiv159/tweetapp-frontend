import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, take } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiResponseService } from '../../core/services/api-response.service';
import { PostService } from '../../core/services/post.service';
import { Post } from '../../models/post';
import { User } from '../../models/user';
import { PostCardComponent } from '../../components/post-card/post-card.component';

@Component({
  selector: 'app-profile-page',
  imports: [PostCardComponent],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePage {
  // Services
  private readonly postService = inject(PostService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly apiResponseService = inject(ApiResponseService);

  // Auth as signals
  private readonly currentUserSignal = toSignal(this.authService.currentUser$, { initialValue: null });
  private readonly tokenSignal = toSignal(this.authService.token$, { initialValue: null });

  protected readonly currentUserId = computed(() => this.currentUserSignal()?.userId ?? null);
  protected readonly canInteract = computed(() => this.tokenSignal() !== null);

  // State
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly posts = signal<Post[]>([]);

  // Per-post pending/error state
  private readonly likePending = signal<Record<string, boolean>>({});
  private readonly commentPending = signal<Record<string, boolean>>({});
  private readonly commentErrors = signal<Record<string, string | null>>({});

  protected isLikePending = (postId: string) => Boolean(this.likePending()[postId]);
  protected isCommentPending = (postId: string) => Boolean(this.commentPending()[postId]);
  protected commentError = (postId: string) => this.commentErrors()[postId] ?? null;

  // Actions
  protected getMyPosts(): void {
    const userId = this.currentUserId();
    if (!userId) {
      this.toastService.info('Sign in to view your posts.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.postService
      .getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (Array.isArray(response.data)) {
            const mine = response.data
              .filter((p) => p.userId === userId)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            this.posts.set(mine);
            return;
          }
          const message = this.apiResponseService.getErrorMessage(response, 'Unable to load posts.');
          this.errorMessage.set(message);
        },
        error: () => {
          this.errorMessage.set('Unable to reach server. Please try again.');
        }
      });
  }

  // Handlers reused from Feed pattern
  protected onToggleLike(postId: string): void {
    const user = this.currentUserSignal();
    if (!user) {
      this.toastService.info('Sign in to like posts.');
      return;
    }

    const snapshot = this.clonePosts(this.posts());
    const updated = snapshot.map((post) => {
      if (post.postId !== postId) return post;
      const hasLiked = post.likes.some((l) => l.userId === user.userId);
      const likes = hasLiked
        ? post.likes.filter((l) => l.userId !== user.userId)
        : [...post.likes, { userId: user.userId, username: user.username }];
      return { ...post, likes };
    });
    this.posts.set(updated);
    this.likePending.update((cur) => ({ ...cur, [postId]: true }));

    this.postService
      .toggleLike(postId)
      .pipe(finalize(() => this.likePending.update((cur) => ({ ...cur, [postId]: false }))))
      .subscribe({
        next: () => this.refreshPost(postId),
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

    this.commentPending.update((cur) => ({ ...cur, [payload.postId]: true }));
    this.commentErrors.update((cur) => ({ ...cur, [payload.postId]: null }));

    this.postService
      .addComment(payload.postId, { content: payload.content })
      .pipe(finalize(() => this.commentPending.update((cur) => ({ ...cur, [payload.postId]: false }))))
      .subscribe({
        next: (response) => {
          if (response.data !== null) {
            this.refreshPost(payload.postId);
            this.toastService.success('Comment added.');
            return;
          }
          const message = this.apiResponseService.getErrorMessage(response, 'Unable to add comment.');
          this.commentErrors.update((cur) => ({ ...cur, [payload.postId]: message }));
        },
        error: () => {
          this.commentErrors.update((cur) => ({ ...cur, [payload.postId]: 'Unable to reach server.' }));
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
          if (!updatedPost) return;
          this.posts.update((arr) => arr.map((p) => (p.postId === postId ? updatedPost : p)));
        }
      });
  }

  private clonePosts(posts: Post[]): Post[] {
    return posts.map((p) => ({ ...p, likes: [...p.likes], comments: [...p.comments] }));
  }

  protected trackByPostId = (_: number, post: Post) => post.postId;
}
