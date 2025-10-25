import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Comment } from '../../models/comment';
import { Post } from '../../models/post';
import { CommentsSectionComponent } from '../comments-section/comments-section.component';
import { TimeAgoPipePipe } from '../../core/pipes/time-ago-pipe-pipe';
import { ExactDatePipePipe } from '../../core/pipes/exact-date-pipe-pipe';

@Component({
  selector: 'app-post-card',
  imports: [RouterLink, CommentsSectionComponent, TimeAgoPipePipe, ExactDatePipePipe],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent {
  // Inputs - Data received from parent component
  readonly post = input<Post>();                            // Post data to display
  readonly currentUserId = input<string | null>(null);      // Logged-in user ID
  readonly likePending = input<boolean>(false);             // Like request in progress
  readonly commentPending = input<boolean>(false);          // Comment request in progress
  readonly commentError = input<string | null>(null);       // Comment error message
  readonly showDetailsLink = input<boolean>(true);          // Show "View details" link
  readonly enableComposer = input<boolean>(true);           // Enable comment composer

  // Outputs - Events emitted to parent component
  readonly likeToggled = output<string>();                  // Emits post ID when like is clicked
  readonly commentSubmitted = output<{ postId: string; content: string }>();  // Emits when comment is submitted

  // Computed state - Derived from inputs
  protected readonly comments = computed<Comment[]>(() => this.post()?.comments ?? []);
  protected readonly likeCount = computed(() => this.post()?.likes.length ?? 0);
  protected readonly hasLiked = computed(() => {
    const post = this.post();
    const userId = this.currentUserId();

    if (!post || !userId) {
      return false;
    }

    return post.likes.some((like) => like.userId === userId);
  });

 // protected readonly createdAtRelative = computed(() => formatRelativeTime(this.post()?.createdAt));
  //protected readonly createdAtExact = computed(() => formatExactTime(this.post()?.createdAt));

  // Local state signal
  protected readonly areCommentsVisible = signal(false);    // Toggle comments section visibility
  private previousCommentTotal = 0;

  constructor() {
    // Auto-open comments when a new comment is added
    effect(() => {
      const currentComments = this.comments().length;
      if (currentComments > this.previousCommentTotal) {
        this.areCommentsVisible.set(true);
      }
      this.previousCommentTotal = currentComments;
    });
  }

  /** Emit like toggle event */
  /** Emit like toggle event */
  protected onToggleLike(): void {
    const post = this.post();
    if (!post || this.likePending()) {
      return;
    }

    this.likeToggled.emit(post.postId);
  }

  /** Toggle comments section visibility */
  protected onToggleComments(): void {
    this.areCommentsVisible.update((current) => !current);
  }

  /** Emit comment submission event */
  protected onSubmitComment(content: string): void {
    const post = this.post();
    if (!post) {
      return;
    }

    this.commentSubmitted.emit({ postId: post.postId, content });
  }
}

/** Format date as relative time (e.g., "2 hours ago") */
/** Format date as relative time (e.g., "2 hours ago") */
function formatRelativeTime(isoDate?: string): string {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const intervals: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1]
  ];

  for (const [unit, secondsInUnit] of intervals) {
    const value = diffSec / secondsInUnit;
    if (Math.abs(value) >= 1 || unit === 'second') {
      const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return formatter.format(Math.round(value), unit);
    }
  }

  return '';
}

/** Format date as exact timestamp (e.g., "Jan 15, 2025, 3:30 PM") */
function formatExactTime(isoDate?: string): string {
  if (!isoDate) {
    return '';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
}
