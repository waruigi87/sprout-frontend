import React, { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        {label && (
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              "w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors",
              icon ? "pl-10" : "", // アイコンがある場合は左に余白を開ける
              error 
                ? "border-red-500 focus:ring-red-200" 
                : "border-gray-300 focus:border-sprout-primary focus:ring-indigo-100",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
      </div>
    );
  }
);