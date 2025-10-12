import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Comment } from '../../models/comment';

@Component({
  selector: 'app-comments-section',
  imports: [ReactiveFormsModule],
  templateUrl: './comments-section.component.html',
  styleUrl: './comments-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentsSectionComponent {
  readonly comments = input<Comment[]>([]);
  readonly canComment = input<boolean>(false);
  readonly submitting = input<boolean>(false);
  readonly error = input<string | null>(null);

  readonly submitComment = output<string>();

  private readonly formBuilder = inject(FormBuilder);
  protected readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(500)]]
  });

  private readonly submitted = signal(false);
  private previousLength = 0;

  constructor() {
    effect(() => {
      const currentLength = this.comments().length;
      if (currentLength > this.previousLength) {
        this.form.reset();
        this.submitted.set(false);
      }
      this.previousLength = currentLength;
    });
  }

  protected onSubmit(): void {
    this.submitted.set(true);

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

  protected hasError(): boolean {
    const control = this.form.controls.content;
    return control.invalid && (control.touched || this.submitted());
  }

  protected formatTimestamp(value: string): string {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  }
}
