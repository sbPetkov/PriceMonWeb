import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    const inputClasses = `
      input
      ${error ? 'input-error' : ''}
      ${icon ? 'pl-12' : ''}
      ${className}
    `.trim();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="block text-sm font-medium text-text-primary mb-2"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-secondary">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${props.id || props.name}-error`
                : helperText
                ? `${props.id || props.name}-helper`
                : undefined
            }
            {...props}
          />
        </div>

        {error && (
          <p
            id={`${props.id || props.name}-error`}
            className="mt-2 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${props.id || props.name}-helper`}
            className="mt-2 text-sm text-text-secondary"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
