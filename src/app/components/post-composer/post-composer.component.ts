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
  readonly disabled = input<boolean>(false);
  readonly placeholder = input<string>('What is happening?');
  readonly submitPost = output<string>();

  private readonly formBuilder = inject(FormBuilder);
  protected readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(280)]]
  });

  protected readonly contentLength = computed(() => this.form.controls.content.value.length);
  protected readonly maxLength = 280;
  private readonly submitted = signal(false);

  protected onSubmit(): void {
    this.submitted.set(true);

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

  reset(): void {
    this.form.reset();
    this.submitted.set(false);
  }

  protected hasError(): boolean {
    const control = this.form.controls.content;
    return control.invalid && (control.touched || this.submitted());
  }
}
