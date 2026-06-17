import React from 'react';

const Input = React.forwardRef(({
  label,
  type = 'text',
  error,
  className = '',
  id,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={id}
        className={`w-full px-3 py-2 text-sm bg-white border ${
          error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
        } rounded-lg shadow-2xs outline-none transition-all duration-200 focus:ring-1 ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
