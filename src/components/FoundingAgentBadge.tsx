'use client';

import React from 'react';

interface FoundingAgentBadgeProps {
  subscriptionTier?: string;
  className?: string;
}

export default function FoundingAgentBadge({ 
  subscriptionTier, 
  className = "" 
}: FoundingAgentBadgeProps) {
  // Show badge for founding members (professional tier from founding agent program)
  if (subscriptionTier !== 'professional' && subscriptionTier !== 'founding_member') {
    return null;
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-yellow-800 bg-gradient-to-r from-yellow-200 to-amber-200 border border-yellow-400 shadow-sm ${className}`}>
      <span className="mr-1">⭐</span>
      Founding Agent
    </div>
  );
}