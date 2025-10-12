import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Comment } from '../../models/comment';
import { Post } from '../../models/post';
import { CommentsSectionComponent } from '../comments-section/comments-section.component';

@Component({
  selector: 'app-post-card',
  imports: [RouterLink, CommentsSectionComponent],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent {
  readonly post = input<Post>();
  readonly currentUserId = input<string | null>(null);
  readonly likePending = input<boolean>(false);
  readonly commentPending = input<boolean>(false);
  readonly commentError = input<string | null>(null);
  readonly showDetailsLink = input<boolean>(true);
  readonly enableComposer = input<boolean>(true);

  readonly likeToggled = output<string>();
  readonly commentSubmitted = output<{ postId: string; content: string }>();

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

  protected readonly createdAtRelative = computed(() => formatRelativeTime(this.post()?.createdAt));
  protected readonly createdAtExact = computed(() => formatExactTime(this.post()?.createdAt));

  protected readonly areCommentsVisible = signal(false);
  private previousCommentTotal = 0;

  constructor() {
    effect(() => {
      const currentComments = this.comments().length;
      if (currentComments > this.previousCommentTotal) {
        this.areCommentsVisible.set(true);
      }
      this.previousCommentTotal = currentComments;
    });
  }

  protected onToggleLike(): void {
    const post = this.post();
    if (!post || this.likePending()) {
      return;
    }

    this.likeToggled.emit(post.postId);
  }

  protected onToggleComments(): void {
    this.areCommentsVisible.update((current) => !current);
  }

  protected onSubmitComment(content: string): void {
    const post = this.post();
    if (!post) {
      return;
    }

    this.commentSubmitted.emit({ postId: post.postId, content });
  }
}

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

function formatExactTime(isoDate?: string): string {
  if (!isoDate) {
    return '';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
}
