import React, { forwardRef } from "react";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;   // needed by EditableDropdown
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;                                           // select-only mode
  success?: boolean;
  error?: boolean;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;                                        // suppress browser suggestions
  style?: React.CSSProperties;                                  // inline styles for chevron padding etc.
}

// forwardRef — lets EditableDropdown call inputRef.current.focus() / setSelectionRange()
const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  onFocus,
  className = "",
  min,
  max,
  step,
  disabled = false,
  readOnly = false,
  success = false,
  error = false,
  hint,
  inputMode,
  autoComplete,
  style,
}, ref) => {

  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    inputClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <input
        ref={ref}                // wires up forwardRef
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        readOnly={readOnly}      // prevents typing in select-only dropdowns
        inputMode={inputMode}
        autoComplete={autoComplete}
        style={style}            // chevron padding / pointer cursor from parent
        className={`${inputClasses} ${type === "date" ? "cursor-pointer" : ""}`}
      />

      {hint && (
        <p className={`mt-1.5 text-xs ${
          error ? "text-error-500" : success ? "text-success-500" : "text-gray-500"
        }`}>
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input"; // shows correct name in React DevTools

export default Input;