import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showTagline = true,
  className = ''
}) => {
  const isLight = variant === 'light';

  // Sizing definitions
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const titleClass =
    size === 'sm'
      ? 'text-base tracking-tight'
      : size === 'lg'
      ? 'text-2xl sm:text-3xl tracking-tight'
      : 'text-xl sm:text-2xl tracking-tight';

  const subtitleClass =
    size === 'sm'
      ? 'text-[11px] tracking-normal font-medium'
      : size === 'lg'
      ? 'text-sm sm:text-base tracking-normal font-medium'
      : 'text-xs sm:text-sm tracking-normal font-medium';

  const taglineClass =
    size === 'sm'
      ? 'text-[9.5px]'
      : size === 'lg'
      ? 'text-xs'
      : 'text-[10.5px]';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Vector Emblem: Modern Shopping Spark & Seal */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform group-hover:scale-105 duration-200"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brandEmeraldGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F4C3A" />
            <stop offset="100%" stopColor="#06281F" />
          </linearGradient>
          <linearGradient id="brandGoldGrad" x1="14" y1="12" x2="38" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Seal */}
        <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#brandEmeraldGrad)" />
        <rect
          x="4.5"
          y="4.5"
          width="39"
          height="39"
          rx="11.5"
          stroke={isLight ? '#34D399' : '#10B981'}
          strokeOpacity={isLight ? '0.5' : '0.25'}
        />

        {/* Minimal Stylized Shopping Bag & Spark Contour */}
        <path
          d="M16 18C16 13.5817 19.5817 10 24 10C28.4183 10 32 13.5817 32 18"
          stroke="url(#brandGoldGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M13 18H35L33.2 36C33.05 37.5 31.8 38.6 30.3 38.6H17.7C16.2 38.6 14.95 37.5 14.8 36L13 18Z"
          fill={isLight ? 'rgba(255,255,255,0.08)' : 'rgba(15,76,58,0.2)'}
          stroke="url(#brandGoldGrad)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Value Sparkle in the Center */}
        <path
          d="M24 22L25.1 24.9L28 26L25.1 27.1L24 30L22.9 27.1L20 26L22.9 24.9L24 22Z"
          fill="#FDE68A"
        />
      </svg>

      {/* Brand Typography */}
      <div className="flex flex-col text-left">
        <div className="flex items-baseline gap-1.5 font-sans leading-none flex-wrap">
          <span
            className={`font-bold font-['Hind_Siliguri',sans-serif] ${
              isLight ? 'text-white' : 'text-[#0F4C3A]'
            } ${titleClass}`}
          >
            সাশ্রয়ী দাম
          </span>
          <span
            className={`font-semibold font-['Plus_Jakarta_Sans',sans-serif] ${
              isLight ? 'text-emerald-300' : 'text-stone-500'
            } ${subtitleClass}`}
          >
            | Sashroyi Daam
          </span>
        </div>
        {showTagline && (
          <span
            className={`mt-1 font-medium leading-tight font-['Hind_Siliguri',sans-serif] ${
              isLight ? 'text-stone-300' : 'text-stone-500'
            } ${taglineClass}`}
          >
            আপনার পছন্দ, সাশ্রয়ী দাম ও সেরা মান
          </span>
        )}
      </div>
    </div>
  );
};
