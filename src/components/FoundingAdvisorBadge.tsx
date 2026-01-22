'use client';

import React from 'react';

interface FoundingAdvisorBadgeProps {
  isFoundingAdvisor?: boolean;
  className?: string;
}

export default function FoundingAdvisorBadge({
  isFoundingAdvisor,
  className = ""
}: FoundingAdvisorBadgeProps) {
  // Show badge for founding advisors
  if (!isFoundingAdvisor) {
    return null;
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-purple-800 bg-gradient-to-r from-purple-200 to-violet-200 border border-purple-400 shadow-sm ${className}`}>
      <span className="mr-1">🎯</span>
      Founding Advisor
    </div>
  );
}
