import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {}

// --- Logo Ufficiale USSO.ch (Doppia Freccia / Chevron Arrotondata >> da Illustrator) ---
export const UssoIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="6715 1030 460 428"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M7163.62,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z" />
    <path d="M6981.83,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z" />
  </svg>
);

// --- Badge Completo Ufficiale USSO.ch (Quadrato Arrotondato + Frecce da Illustrator) ---
export const UssoBadgeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="6643.55 940.33 592.25 592.26"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path fill="#36a9e1" d="M7235.8,967.13v538.66c0,14.8-12,26.8-26.8,26.8h-538.66c-14.8,0-26.79-12-26.79-26.8v-538.66c0-14.8,11.99-26.8,26.79-26.8h538.66c14.8,0,26.8,12,26.8,26.8Z" />
    <g>
      <path fill="#ffffff" d="M7163.62,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z" />
      <path fill="#ffffff" d="M6981.83,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z" />
    </g>
  </svg>
);

export interface UssoLogoProps {
  className?: string;
  variant?: 'icon' | 'badge-solid' | 'badge-outline' | 'full';
  iconClassName?: string;
}

export const UssoLogo: React.FC<UssoLogoProps> = ({
  className = '',
  variant = 'badge-solid',
  iconClassName = 'w-5 h-5'
}) => {
  if (variant === 'icon') {
    return <UssoIcon className={`text-[#36A9E1] ${iconClassName} ${className}`} />;
  }

  if (variant === 'badge-solid') {
    return <UssoBadgeIcon className={`${iconClassName} ${className}`} />;
  }

  if (variant === 'badge-outline') {
    return (
      <div className={`inline-flex items-center justify-center p-1 rounded-lg bg-white text-[#36A9E1] border border-slate-200 shadow-xs ${className}`}>
        <UssoIcon className={iconClassName} />
      </div>
    );
  }

  // Variant === 'full'
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <UssoBadgeIcon className={`w-6 h-6 shrink-0 ${iconClassName}`} />
      <span className="text-base font-extrabold tracking-tight text-[var(--ink)]">
        USSO<span className="text-[#36a9e1]">.ch</span>
      </span>
    </div>
  );
};

export const UssoSecurityBadge: React.FC<{ className?: string; text?: string }> = ({
  className = '',
  text = 'Protetto da USSO.ch • Sovranità Svizzera nLPD'
}) => (
  <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--cream)] text-[var(--muted)] text-xs rounded-lg border border-[var(--line)] shadow-xs ${className}`}>
    <span className="w-2 h-2 rounded-full bg-[#36a9e1] animate-pulse shrink-0" />
    <span className="font-medium">{text}</span>
  </div>
);
