'use client';

import React from 'react';

interface FoundingAgentBadgeProps {
  isFoundingMember?: boolean;
  className?: string;
}

export default function FoundingAgentBadge({
  isFoundingMember,
  className = ""
}: FoundingAgentBadgeProps) {
  if (!isFoundingMember) {
    return null;
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-yellow-800 bg-gradient-to-r from-yellow-200 to-amber-200 border border-yellow-400 shadow-sm ${className}`}>
      <span className="mr-1">⭐</span>
      Founding Agent
    </div>
  );
}