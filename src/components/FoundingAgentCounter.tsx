'use client';

import React, { useEffect, useState } from 'react';

interface FoundingAgentCounterProps {
  userType?: string;
  countryId?: string;
  className?: string;
}

export default function FoundingAgentCounter({ 
  userType = 'agent',
  countryId = 'GY',
  className = ""
}: FoundingAgentCounterProps) {
  const [counterData, setCounterData] = useState<{
    spotsRemaining: number;
    maxSpots: number;
    isLoading: boolean;
  }>({
    spotsRemaining: 0,
    maxSpots: 25,
    isLoading: true
  });

  useEffect(() => {
    fetchFoundingAgentCounter();
  }, [userType, countryId]);

  const fetchFoundingAgentCounter = async () => {
    try {
      const response = await fetch('/api/founding-agent/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          countryId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCounterData({
          spotsRemaining: data.spotsRemaining,
          maxSpots: data.maxSpots,
          isLoading: false
        });
      } else {
        setCounterData(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to fetch founding agent counter:', error);
      setCounterData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Don't show if not agent type or no spots remaining
  if (userType !== 'agent' || counterData.spotsRemaining <= 0) {
    return null;
  }

  if (counterData.isLoading) {
    return (
      <div className={`bg-amber-50 border border-amber-300 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-amber-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-amber-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const spotsClaimedPercentage = ((counterData.maxSpots - counterData.spotsRemaining) / counterData.maxSpots) * 100;

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-center mb-3">
        <span className="text-2xl mr-2">🏆</span>
        <h3 className="text-lg font-bold text-amber-800">Founding Agent Program</h3>
        <span className="text-2xl ml-2">🏆</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-amber-700 mb-1">
          <span>Spots Claimed</span>
          <span>{counterData.maxSpots - counterData.spotsRemaining} of {counterData.maxSpots}</span>
        </div>
        <div className="w-full bg-amber-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-amber-500 to-yellow-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${spotsClaimedPercentage}%` }}
          />
        </div>
      </div>

      {/* Urgency Message */}
      <div className="text-center">
        <div className="text-lg font-bold text-amber-800">
          ⚡ Only {counterData.spotsRemaining} spots remaining!
        </div>
        <div className="text-sm text-amber-600 mt-1">
          Join the founding agents with exclusive benefits
        </div>
      </div>
    </div>
  );
}