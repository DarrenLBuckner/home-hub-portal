'use client';

interface FSBOBadgeProps {
  listedByType?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FSBOBadge({ listedByType, className = "", size = 'sm' }: FSBOBadgeProps) {
  // Only show for owner/fsbo listings
  if (listedByType !== 'owner' && listedByType !== 'fsbo') return null;

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm', 
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} font-medium bg-orange-100 text-orange-800 border border-orange-300 rounded-full shadow-sm ${className}`}>
      🏠 For Sale By Owner
    </span>
  );
}

// Compact version without emoji for tight spaces
export function FSBOBadgeCompact({ listedByType, className = "" }: FSBOBadgeProps) {
  if (listedByType !== 'owner' && listedByType !== 'fsbo') return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-md ${className}`}>
      FSBO
    </span>
  );
}