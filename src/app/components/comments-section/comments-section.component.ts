import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Comment } from '../../models/comment';
import { ExactDatePipePipe } from '../../core/pipes/exact-date-pipe-pipe';
import { TimeAgoPipePipe } from '../../core/pipes/time-ago-pipe-pipe';

@Component({
  selector: 'app-comments-section',
  imports: [ReactiveFormsModule,ExactDatePipePipe,TimeAgoPipePipe],
  templateUrl: './comments-section.component.html',
  styleUrl: './comments-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentsSectionComponent {
  // Inputs - Data and state from parent
  readonly comments = input<Comment[]>([]);                 // Array of comments to display
  readonly canComment = input<boolean>(false);              // User is allowed to comment
  readonly submitting = input<boolean>(false);              // Comment submission in progress
  readonly error = input<string | null>(null);              // Submission error message

  // Output - Event emitted on submission
  readonly submitComment = output<string>();                // Emits comment content

  // Services
  private readonly formBuilder = inject(FormBuilder);
  
  // Form with validation
  protected readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(500)]]
  });

  // State signal
  private readonly submitted = signal(false);               // Form was submitted at least once
  private previousLength = 0;

  constructor() {
    // Auto-reset form when new comment is added
    effect(() => {
      const currentLength = this.comments().length;
      if (currentLength > this.previousLength) {
        this.form.reset();
        this.submitted.set(false);
      }
      this.previousLength = currentLength;
    });
  }

  /** Handle comment submission */
  /** Handle comment submission */
  protected onSubmit(): void {
    this.submitted.set(true);

    // Validate before submitting
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.canComment()) {
      return;
    }

    const { content } = this.form.getRawValue();
    this.submitComment.emit(content.trim());
  }

  /** Check if form should show error state */
  protected hasError(): boolean {
    const control = this.form.controls.content;
    return control.invalid && (control.touched || this.submitted());
  }

  /** Format comment timestamp for display */
  
}
