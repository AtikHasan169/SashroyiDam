import React, { useState } from 'react';

/**
 * Official bKash Brand Logo
 * Loads the official high-resolution vector SVG asset sourced directly from official archives.
 */
export const BKashLogo: React.FC<{
  className?: string;
  variant?: 'full' | 'symbol' | 'badge';
}> = ({ className = 'h-7 w-auto', variant = 'full' }) => {
  const [hasError, setHasError] = useState(false);

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-pink-200/90 shadow-2xs ${className}`}>
        <BKashLogo variant="full" className="h-5 w-auto" />
      </div>
    );
  }

  if (hasError) {
    // Fallback Vector SVG
    return (
      <svg
        viewBox="0 0 148 46"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="bKash"
      >
        <g transform="translate(2, 1)">
          <path d="M23 2 L42 14 L26 18 Z" fill="#E2136E" />
          <path d="M26 18 L38.5 27 L29.5 27 Z" fill="#D11264" />
          <path d="M4 25 L23 2 L26 18 L13.5 33 Z" fill="#E2136E" />
          <path d="M13.5 33 L29.5 27 L35.5 43 L18 38.5 Z" fill="#B50E55" />
          <path d="M23 2 L26 18 L21.5 20 Z" fill="#FF65A5" opacity="0.9" />
        </g>
        <g fill="#E2136E">
          <path d="M52 8 h 4 v 11.2 c 1.4-2.2 3.6-3.4 6.5-3.4 5.3 0 9 4.2 9 9.8 0 5.8-3.7 9.8-9 9.8-2.9 0-5.1-1.2-6.5-3.4 V 35 h -4 V 8 z m 4 17.6 c 0 3.7 2.4 6.2 5.6 6.2 3.3 0 5.6-2.5 5.6-6.2 0-3.6-2.3-6.2-5.6-6.2-3.2 0-5.6 2.6-5.6 6.2 z" />
          <path d="M76 8 h 4.2 v 13.8 l 7.2-5.8 h 5.2 l -7.8 6.4 8.5 12.6 h -5.1 l -6.2-9.6 -1.8 1.5 V 35 H 76 V 8 z" />
          <path d="M104.5 16.5 v 3.2 c -1.3-2.1-3.4-3.2-6-3.2-4.6 0-7.8 3.5-7.8 8.6 0 5.2 3.2 8.7 7.8 8.7 2.6 0 4.7-1.1 6-3.2 v 3.2 h 4 v -17.3 h -4 z m -5.5 14 c -3 0-5-2.2-5-5.4 0-3.2 2-5.4 5-5.4 3 0 5.1 2.2 5.1 5.4 0 3.2-2.1 5.4-5.1 5.4 z" />
          <path d="M117 26.5 c 0-3 2.1-4.7 5.7-5.4 2.2-0.4 3.7-0.9 3.7-2.1 0-1.2-1.2-1.9-2.9-1.9-1.9 0-3.4 0.8-4.3 2.1 l -2.8-2.4 c 1.6-2.1 4.1-3.3 7.2-3.3 4.2 0 6.8 2.2 6.8 5.6 v 15.9 h -4 v -2.8 c -1.3 1.9-3.3 3.1-5.8 3.1-3.7 0-6.1-2.2-6.1-5.5 z m 9.4 0.4 v -3.2 c -0.5 0.3-1.6 0.7-2.8 0.9-2 0.4-3 1.3-3 2.5 0 1.5 1.1 2.4 2.8 2.4 1.8 0 3-1.1 3-2.6 z" />
          <path d="M133 8 h 4 v 11.2 c 1.3-2.2 3.5-3.4 6.3-3.4 4.3 0 7 2.8 7 7.6 V 35 h -4 v -11 c 0-2.8-1.5-4.4-4-4.4-2.8 0-4.8 2-4.8 5.2 V 35 h -4 V 8 z" />
        </g>
      </svg>
    );
  }

  return (
    <img
      src="/images/bkash-logo.svg"
      alt="bKash Official Logo"
      onError={() => setHasError(true)}
      className={`object-contain select-none ${className}`}
      loading="lazy"
    />
  );
};

/**
 * Official Nagad Brand Logo
 * Loads the official high-resolution vector SVG asset sourced directly from official archives.
 */
export const NagadLogo: React.FC<{
  className?: string;
  variant?: 'full' | 'symbol' | 'badge';
}> = ({ className = 'h-7 w-auto', variant = 'full' }) => {
  const [hasError, setHasError] = useState(false);

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-orange-200/90 shadow-2xs ${className}`}>
        <NagadLogo variant="full" className="h-5 w-auto" />
      </div>
    );
  }

  if (hasError) {
    // Fallback Vector SVG
    return (
      <svg
        viewBox="0 0 148 46"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Nagad Logo"
      >
        <g transform="translate(2, 2)">
          <circle cx="21" cy="21" r="21" fill="#F7921E" />
          <path
            d="M21 5 C29.5 5 36 12 36 21 C36 29.5 29.5 36.5 21 36.5 C13.5 36.5 8 29.5 8 21 C8 13 14 8.5 19.5 8.5 C17.5 12 16.5 16.5 17.5 20 C18.5 25 23.5 27.5 27 25 C30.5 22.5 30.5 17.5 28 14 C25.5 10.5 21 5 21 5 Z"
            fill="#FFFFFF"
          />
          <path
            d="M22.5 12 C26 15.5 27 20.5 25 24 C22.5 26.5 19 25 18 22.5 C17 19 18 15.5 20.5 13 Z"
            fill="#E03E1A"
          />
        </g>
        <g fill="#E03E1A">
          <path d="M54 16 h 4.2 v 2.8 c 1.4-2.1 3.7-3.3 6.4-3.3 4.6 0 7.4 3 7.4 7.8 V 35 h -4.2 v -11 c 0-2.8-1.5-4.4-4-4.4-2.9 0-4.8 2-4.8 5.2 V 35 H 54 V 16 z" />
          <path d="M85 16 h 4.2 v 15.2 c 0 1.2 0.5 1.7 1.6 1.7 0.8 0 1.6-0.2 2.2-0.6 l 1 3.2 c -1.1 0.7-2.6 1-4.2 1-3 0-4.8-1.5-4.8-4.5 v -2.2 c -1.4 2.2-3.7 3.4-6.6 3.4-4.8 0-8-3.4-8-8.6 0-5.3 3.3-8.8 8.2-8.8 2.8 0 5.1 1.2 6.4 3.4 V 16 z m -5.5 13.8 c 2.9 0 4.9-2.1 4.9-5.2 0-3.1-2-5.2-4.9-5.2-2.9 0-4.9 2.1-4.9 5.2 0 3.1 2 5.2 4.9 5.2 z" />
          <path d="M109 16 h 4.2 v 15.2 c 0 4.8-3.2 8-8.8 8-3.5 0-6.4-1.2-8-3.2 l 2.4-2.6 c 1.2 1.5 3.3 2.4 5.6 2.4 3.4 0 4.6-1.8 4.6-4.6 v -1.8 c -1.4 2.1-3.6 3.3-6.4 3.3-4.8 0-8-3.5-8-8.7 0-5.2 3.2-8.8 8-8.8 2.8 0 5 1.2 6.4 3.3 V 16 z m -5.5 13.8 c 2.9 0 4.9-2.1 4.9-5.2 0-3.1-2-5.2-4.9-5.2-2.9 0-4.9 2.1-4.9 5.2 0 3.1 2 5.2 4.9 5.2 z" />
          <path d="M127 16 h 4.2 v 15.2 c 0 1.2 0.5 1.7 1.6 1.7 0.8 0 1.6-0.2 2.2-0.6 l 1 3.2 c -1.1 0.7-2.6 1-4.2 1-3 0-4.8-1.5-4.8-4.5 v -2.2 c -1.4 2.2-3.7 3.4-6.6 3.4-4.8 0-8-3.4-8-8.6 0-5.3 3.3-8.8 8.2-8.8 2.8 0 5.1 1.2 6.4 3.4 V 16 z m -5.5 13.8 c 2.9 0 4.9-2.1 4.9-5.2 0-3.1-2-5.2-4.9-5.2-2.9 0-4.9 2.1-4.9 5.2 0 3.1 2 5.2 4.9 5.2 z" />
          <path d="M141.5 7.5 h 4.2 V 35 h -4.2 v -3 c -1.4 2.1-3.7 3.3-6.5 3.3-5 0-8.5-3.6-8.5-8.8 0-5.2 3.5-8.7 8.5-8.7 2.8 0 5.1 1.2 6.5 3.3 V 7.5 z m -5.5 22.3 c 3 0 5-2.2 5-5.3 0-3.1-2-5.3-5-5.3-3 0-5 2.2-5 5.3 0 3.1 2 5.3 5 5.3 z" />
        </g>
      </svg>
    );
  }

  return (
    <img
      src="/images/nagad-logo.svg"
      alt="Nagad Official Logo"
      onError={() => setHasError(true)}
      className={`object-contain select-none ${className}`}
      loading="lazy"
    />
  );
};

/**
 * Cash on Delivery (COD) Badge & Icon
 */
export const CodLogo: React.FC<{ className?: string }> = ({
  className = 'h-6 w-auto'
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
      <span className="text-[11px] font-bold tracking-tight">COD</span>
    </div>
  );
};

export const CodBadge: React.FC<{ className?: string }> = ({
  className = 'h-7'
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 shadow-2xs ${className}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[11px] font-bold tracking-tight">ক্যাশ অন ডেলিভারি (COD)</span>
    </div>
  );
};


