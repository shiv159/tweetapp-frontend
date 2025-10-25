// ==============================================================================
// IMPORTS
// ==============================================================================

// Angular Core imports
import { ChangeDetectionStrategy, Component, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop'; // Converts Observables to Signals
import { finalize, take } from 'rxjs/operators'; // RxJS operators for stream manipulation

// Services - Business logic and API communication
import { ApiResponseService } from '../../core/services/api-response.service';
import { AuthService } from '../../core/services/auth.service';
import { PostService } from '../../core/services/post.service';
import { ToastService } from '../../core/services/toast.service';

// Models - TypeScript interfaces defining data structures
import { Post } from '../../models/post';

// Components - Reusable UI pieces
import { PostComposerComponent } from '../../components/post-composer/post-composer.component';
import { PostCardComponent } from '../../components/post-card/post-card.component';

// ==============================================================================
// COMPONENT DECORATOR
// ==============================================================================

@Component({
  selector: 'app-feed-page', // HTML tag: <app-feed-page></app-feed-page>
  imports: [PostComposerComponent, PostCardComponent], // Standalone components used in template
  templateUrl: './feed.page.html', // HTML template file
  styleUrl: './feed.page.css', // Component-specific styles
  changeDetection: ChangeDetectionStrategy.OnPush // Performance: Only check when inputs change
})

// ==============================================================================
// FEED PAGE COMPONENT
// ==============================================================================
// This is the main Feed/Timeline page component (Smart/Container component)
// Responsibilities:
// 1. Fetch all posts from the API
// 2. Handle user interactions (like, comment, create post)
// 3. Manage loading/error states
// 4. Orchestrate child components (PostCard, PostComposer)
// ==============================================================================

export class FeedPageComponent {
  
  // ============================================================================
  // VIEW CHILD - Reference to child component
  // ============================================================================
  
  // Get reference to PostComposerComponent instance to call its methods
  // Used to reset the composer after successful post creation
  @ViewChild(PostComposerComponent) private composer?: PostComposerComponent;

  // ============================================================================
  // DEPENDENCY INJECTION - Services injected using inject() function
  // ============================================================================
  
  private readonly postService = inject(PostService);               // API calls for posts
  private readonly toastService = inject(ToastService);             // Show notifications
  private readonly authService = inject(AuthService);               // Get current user info
  private readonly apiResponseService = inject(ApiResponseService); // Parse API responses

  // ============================================================================
  // STATE MANAGEMENT - Signals for reactive state
  // ============================================================================
  
  // --- PUBLIC STATE (used in template) ---
  
  // Array of all posts to display in the feed
  protected readonly posts = signal<Post[]>([]);
  
  // Loading indicator for initial posts fetch
  protected readonly isLoading = signal(true);
  
  // Error message when posts fail to load
  protected readonly errorMessage = signal<string | null>(null);
  
  // Loading state for post creation (composer)
  protected readonly composerPending = signal(false);

  // --- PRIVATE STATE (internal tracking) ---
  
  // Track which posts have pending like requests
  // Example: { 'post-123': true, 'post-456': false }
  private readonly likePending = signal<Record<string, boolean>>({});
  
  // Track which posts have pending comment requests
  private readonly commentPending = signal<Record<string, boolean>>({});
  
  // Track error messages for failed comments (per post)
  private readonly commentErrors = signal<Record<string, string | null>>({});

  // ============================================================================
  // COMPUTED STATE - Derived values that auto-update
  // ============================================================================
  
  // Convert Observable streams from AuthService to Signals
  // toSignal() creates a Signal that updates whenever the Observable emits
  private readonly currentUserSignal = toSignal(this.authService.currentUser$, { initialValue: null });
  private readonly tokenSignal = toSignal(this.authService.token$, { initialValue: null });
  
  // Compute current user ID (null if not logged in)
  protected readonly currentUserId = computed(() => this.currentUserSignal()?.userId ?? null);
  
  // Check if user is authenticated (has token)
  protected readonly canInteract = computed(() => this.tokenSignal() !== null);

  // ============================================================================
  // CONSTRUCTOR - Component initialization
  // ============================================================================
  
  constructor() {
    // Load posts immediately when page is created
    this.loadPosts();
  }

  // ============================================================================
  // HELPER METHODS - Utility functions used in template
  // ============================================================================
  
  /**
   * TrackBy function for @for loop performance optimization
   * Angular uses this to identify which items changed in the array
   * By tracking postId, Angular only re-renders changed posts, not all posts
   * 
   * @param _ - Index (unused)
   * @param post - The post object
   * @returns Unique identifier for the post
   */
  protected trackByPostId = (_: number, post: Post) => post.postId;

  /**
   * Check if a specific post's like action is pending
   * Used to disable like button while request is in-flight
   */
  protected isLikePending(postId: string): boolean {
    return Boolean(this.likePending()[postId]);
  }

  /**
   * Check if a specific post's comment submission is pending
   * Used to disable comment form while request is in-flight
   */
  protected isCommentPending(postId: string): boolean {
    return Boolean(this.commentPending()[postId]);
  }

  /**
   * Get error message for a specific post's comment submission
   * Used to display error below comment form
   */
  protected commentError(postId: string): string | null {
    return this.commentErrors()[postId] ?? null;
  }

  // ============================================================================
  // EVENT HANDLERS - User interaction handlers
  // ============================================================================
  
  /**
   * Handle new post submission from PostComposerComponent
   * Flow:
   * 1. Validate content is not empty
   * 2. Set loading state
   * 3. Call API to create post
   * 4. On success: Add post to feed, show success toast, reset composer
   * 5. On error: Show error toast
   * 
   * @param content - The post content text
   */
  protected onComposerSubmit(content: string): void {
    // Guard: Don't submit empty posts
    if (!content.trim()) {
      return;
    }

    // Set loading state (disables composer)
    this.composerPending.set(true);

    // Call API to create post
    this.postService
      .create({ content })
      .pipe(
        // finalize() runs after success OR error (cleanup)
        finalize(() => this.composerPending.set(false))
      )
      .subscribe({
        // Success handler
        next: (response) => {
          const post = response.data;
          
          // If post was created successfully
          if (post) {
            // Add new post to the TOP of the feed (prepend)
            this.posts.update((current) => [post, ...current]);
            
            // Show success notification
            this.toastService.success('Post published.');
            
            // Clear the composer form
            this.composer?.reset();
            return;
          }

          // If API returned error in response
          const message = this.apiResponseService.getErrorMessage(response, 'Unable to publish post.');
          this.toastService.error(message);
        },
        
        // Network error handler (can't reach server)
        error: () => {
          this.toastService.error('Unable to reach server. Please try again.');
        }
      });
  }

  /**
   * Handle like/unlike toggle from PostCardComponent
   * Uses OPTIMISTIC UI UPDATE pattern:
   * 1. Immediately update UI (assume success)
   * 2. Send API request
   * 3. If API fails, rollback UI changes
   * 
   * This makes the app feel fast and responsive!
   * 
   * @param postId - ID of the post to like/unlike
   */
  protected onToggleLike(postId: string): void {
    // Guard: Check if user is logged in
    const user = this.currentUserSignal();
    if (!user) {
      this.toastService.info('Sign in to like posts.');
      return;
    }

    // 1. SAVE SNAPSHOT (for rollback if API fails)
    const snapshot = clonePosts(this.posts());
    
    // 2. OPTIMISTIC UPDATE - Update UI immediately
    const updated = snapshot.map((post) => {
      // Only modify the post that was liked
      if (post.postId !== postId) {
        return post;
      }

      // Check if user already liked this post
      const hasLiked = post.likes.some((like) => like.userId === user.userId);
      
      // Toggle like: remove if liked, add if not liked
      const likes = hasLiked
        ? post.likes.filter((like) => like.userId !== user.userId) // Unlike
        : [...post.likes, { userId: user.userId, username: user.username }]; // Like

      // Return updated post
      return { ...post, likes };
    });

    // Update UI with optimistic changes
    this.posts.set(updated);
    
    // Mark this post's like as pending (shows loading indicator)
    this.likePending.update((current) => ({ ...current, [postId]: true }));

    // 3. SEND API REQUEST
    this.postService
      .toggleLike(postId)
      .pipe(
        // Clear pending state when done (success or error)
        finalize(() => this.likePending.update((current) => ({ ...current, [postId]: false })))
      )
      .subscribe({
        // Success: Refresh post from server to get accurate data
        next: () => {
          this.refreshPost(postId);
        },
        
        // Error: Rollback optimistic changes
        error: () => {
          this.posts.set(snapshot); // Restore original state
          this.toastService.error('Unable to update like. Please try again.');
        }
      });
  }

  /**
   * Handle comment submission from PostCardComponent
   * Flow:
   * 1. Check if user is logged in
   * 2. Set loading state for this specific post
   * 3. Call API to add comment
   * 4. On success: Refresh post data, show success toast
   * 5. On error: Show error message below comment form
   * 
   * @param payload - Object containing postId and comment content
   */
  protected onCommentSubmit(payload: { postId: string; content: string }): void {
    // Guard: Check if user is logged in
    const user = this.currentUserSignal();
    // if (!user) {
    //   this.toastService.info('Sign in to comment.');
    //   return;
    // }

    // Set loading state for THIS post only
    this.commentPending.update((current) => ({ ...current, [payload.postId]: true }));
    
    // Clear any previous error for THIS post
    this.commentErrors.update((current) => ({ ...current, [payload.postId]: null }));

    // Call API to add comment
    this.postService
      .addComment(payload.postId, { content: payload.content })
      .pipe(
        // Clear pending state when done
        finalize(() => this.commentPending.update((current) => ({ ...current, [payload.postId]: false })))
      )
      .subscribe({
        // Success handler
        next: (response) => {
          // If comment was added successfully
          if (response.data !== null) {
            // Refresh post from server to get the new comment
            this.refreshPost(payload.postId);
            
            // Show success notification
            this.toastService.success('Comment added.');
            return;
          }

          // If API returned error in response
          const message = this.apiResponseService.getErrorMessage(response, 'Unable to add comment.');
          
          // Store error for THIS post (shown below comment form)
          this.commentErrors.update((current) => ({ ...current, [payload.postId]: message }));
        },
        
        // Network error handler
        error: () => {
          this.commentErrors.update((current) => ({ ...current, [payload.postId]: 'Unable to reach server.' }));
        }
      });
  }

  /**
   * Retry loading posts after an error
   * Called when user clicks "Try again" button
   */
  protected retry(): void {
    this.loadPosts();
  }

  // ============================================================================
  // PRIVATE METHODS - Internal helper functions
  // ============================================================================
  
  /**
   * Load all posts from the API
   * Called on component initialization and when retry is clicked
   * 
   * Flow:
   * 1. Set loading state
   * 2. Call API
   * 3. Sort posts by date (newest first)
   * 4. Update posts signal
   * 5. Handle errors
   */
  private loadPosts(): void {
    // Set loading indicators
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Call API to get all posts
    this.postService
      .getAll()
      .pipe(
        // Always clear loading state (success or error)
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        // Success handler
        next: (response) => {
          // Check if we got valid data
          if (Array.isArray(response.data)) {
            // Sort posts by creation date (newest first)
            // Create a copy to avoid mutating original array
            const sorted = [...response.data].sort((a, b) => 
              (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            );
            
            // Update posts signal with sorted data
            this.posts.set(sorted);
            return;
          }

          // If API returned error in response
          const message = this.apiResponseService.getErrorMessage(response, 'Unable to load feed.');
          this.errorMessage.set(message);
        },
        
        // Network error handler (can't reach server)
        error: () => {
          this.errorMessage.set('Unable to reach server. Please try again.');
        }
      });
  }

  /**
   * Refresh a single post from the server
   * Used after like/comment to get the latest data
   * 
   * Why not update locally?
   * - Server might have validation logic
   * - Other users might have interacted with the post
   * - Ensures UI stays in sync with backend
   * 
   * @param postId - ID of the post to refresh
   */
  private refreshPost(postId: string): void {
    this.postService
      .getById(postId)
      .pipe(
        // take(1) - Complete Observable after first emission (no memory leaks)
        take(1)
      )
      .subscribe({
        next: (response) => {
          const updatedPost = response.data;
          
          // Guard: Check if we got valid data
          if (!updatedPost) {
            return;
          }

          // Update ONLY this post in the array
          // Replace the old post with the new one from the server
          this.posts.update((posts) =>
            posts.map((post) => (post.postId === postId ? updatedPost : post))
          );
        }
        // Note: No error handler - we silently fail to avoid annoying users
        // The optimistic update already happened, so UI looks fine
      });
  }
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Deep clone posts array to create a snapshot for rollback
 * Important: We need to clone nested arrays (likes, comments) too!
 * 
 * Why?
 * - For optimistic updates, we need to save the original state
 * - If API fails, we rollback to this snapshot
 * - Shallow copy would share references (modifying one affects the other)
 * 
 * @param posts - Array of posts to clone
 * @returns Deep cloned array
 */
function clonePosts(posts: Post[]): Post[] {
  return posts.map((post) => ({
    ...post,                      // Spread operator copies top-level properties
    likes: [...post.likes],       // Clone likes array
    comments: [...post.comments]  // Clone comments array
  }));
}
