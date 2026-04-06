import type { LabelHTMLAttributes, ReactNode } from 'react';

interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

/**
 * Canonical form label atom.
 * Enforces consistent text-sm, font-medium, text-foreground, mb-1 across all form fields.
 */
export default function FormLabel({ className = '', children, ...rest }: FormLabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-foreground mb-1 ${className}`}
      {...rest}
    >
      {children}
    </label>
  );
}
