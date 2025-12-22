import React, { type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-full font-bold transition-all duration-200 active:scale-95 disabled:opacity-50";
  
  const variants = {
    primary: "bg-sprout-primary text-white hover:bg-opacity-90 shadow-md", // 紫
    success: "bg-[#458e48] text-white hover:bg-opacity-90 shadow-md", // 深緑
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
    ghost: "bg-transparent text-white hover:bg-white/20 border border-white", // 透明
  };

  return (
    <button 
      className={clsx(
        baseStyles,
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};