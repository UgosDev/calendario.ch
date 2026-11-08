import React from 'react';
import { UssoBadgeIcon } from './UssoLogo';

export interface UssoAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action?: 'login' | 'register' | 'custom';
  label?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const UssoAuthButton: React.FC<UssoAuthButtonProps> = ({
  action = 'login',
  label,
  loading = false,
  size = 'md',
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const defaultText = label || (action === 'register' ? 'Registrati con USSO' : 'Accedi con USSO');

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs rounded-lg gap-2',
    md: 'h-10 px-3.5 text-xs font-bold rounded-xl gap-2.5',
    lg: 'h-12 px-5 text-sm font-bold rounded-xl gap-3',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const isWhiteVariant = className.includes('bg-white');
  const textColor = isWhiteVariant ? 'var(--ink)' : '#ffffff';
  const bgColor = isWhiteVariant ? '#ffffff' : 'var(--ink)';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        isWhiteVariant ? 'hover:bg-slate-100 text-[var(--ink)]' : 'hover:opacity-90 active:scale-[0.99] text-white'
      } ${sizeClasses} ${className}`}
      style={{ backgroundColor: bgColor, color: textColor, ...props.style }}
      {...props}
    >
      <UssoBadgeIcon className={`${iconSizes} shrink-0`} />
      <span style={{ color: textColor }}>{loading ? 'Reindirizzamento a USSO...' : defaultText}</span>
    </button>
  );
};

export default UssoAuthButton;
