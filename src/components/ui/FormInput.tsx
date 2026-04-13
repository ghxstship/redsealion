import { forwardRef, type InputHTMLAttributes } from 'react';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Compact uses smaller padding. Defaults to 'default'. */
  inputSize?: 'default' | 'compact';
}

const SIZE_CLASSES = {
  default: 'px-3 py-2',
  compact: 'px-2.5 py-1.5',
} as const;

/**
 * Canonical form input atom.
 * Enforces consistent border-radius, border, focus ring, and padding.
 */
const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ inputSize = 'default', className = '', ...rest }, ref) {
    const isInvalid = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true';
    
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border bg-background text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 ${
          isInvalid ? 'border-red-500/50 focus:border-red-500' : 'border-border'
        } ${SIZE_CLASSES[inputSize]} ${className}`}
        {...rest}
      />
    );
  },
);

export default FormInput;
