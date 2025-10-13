import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { input, output } from '@angular/core';

@Component({
  selector: 'app-post-composer',
  imports: [ReactiveFormsModule],
  templateUrl: './post-composer.component.html',
  styleUrl: './post-composer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostComposerComponent {
  // Inputs - Configuration from parent
  readonly disabled = input<boolean>(false);                // Disable form during submission
  readonly placeholder = input<string>('What is happening?');  // Textarea placeholder text
  
  // Output - Event emitted on submission
  readonly submitPost = output<string>();                   // Emits post content

  // Services
  private readonly formBuilder = inject(FormBuilder);
  
  // Form with validation
  protected readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(280)]]
  });

  // Computed state
  protected readonly contentLength = computed(() => this.form.controls.content.value.length);
  protected readonly maxLength = 280;
  
  // State signal
  private readonly submitted = signal(false);               // Form was submitted at least once

  /** Handle form submission */
  /** Handle form submission */
  protected onSubmit(): void {
    this.submitted.set(true);

    // Validate before submitting
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.disabled()) {
      return;
    }

    const { content } = this.form.getRawValue();
    this.submitPost.emit(content.trim());
  }

  /** Reset form to initial state (called by parent after successful submission) */
  reset(): void {
    this.form.reset();
    this.submitted.set(false);
  }

  /** Check if form should show error state */
  protected hasError(): boolean {
    const control = this.form.controls.content;
    return control.invalid && (control.touched || this.submitted());
  }
}
