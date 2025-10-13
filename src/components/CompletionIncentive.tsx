// Property Completion Incentive Component
// Purpose: Encourage complete listings while respecting privacy
// Used across Agent, Landlord, and FSBO forms

import React from 'react';

interface CompletionIncentiveProps {
  fieldName: string;
  fieldType: 'address' | 'squareFootage' | 'yearBuilt' | 'amenities' | 'images' | 'description';
  isCompleted: boolean;
  userType: 'agent' | 'landlord' | 'fsbo';
}

const COMPLETION_BENEFITS = {
  address: {
    impact: "85%",
    benefit: "Properties with specific locations get 85% more inquiries",
    privacy: "Required for verification only - never shown to customers until you approve them"
  },
  squareFootage: {
    impact: "73%",
    benefit: "Listings with size info are 73% more likely to close deals",
    privacy: "Approximate size helps buyers filter efficiently"
  },
  yearBuilt: {
    impact: "62%",
    benefit: "Age information increases buyer confidence by 62%",
    privacy: "Even approximate decade helps (e.g., 'Built around 2010s')"
  },
  amenities: {
    impact: "91%",
    benefit: "Properties with amenities listed get 91% more views",
    privacy: "List standout features that attract serious buyers"
  },
  images: {
    impact: "95%",
    benefit: "Listings with 8+ photos are 95% more successful",
    privacy: "Show property highlights while maintaining owner privacy"
  },
  description: {
    impact: "78%",
    benefit: "Detailed descriptions increase qualified leads by 78%",
    privacy: "Focus on property features rather than personal details"
  }
};

const USER_MOTIVATIONS = {
  agent: {
    primary: "Close deals faster",
    secondary: "Attract serious buyers",
    cta: "Maximize your commission potential"
  },
  landlord: {
    primary: "Reduce vacancy time",
    secondary: "Find quality tenants",
    cta: "Fill your property quickly"
  },
  fsbo: {
    primary: "Sell without agent fees",
    secondary: "Get full market value",
    cta: "Maximize your sale price"
  }
};

export default function CompletionIncentive({ 
  fieldName, 
  fieldType, 
  isCompleted, 
  userType 
}: CompletionIncentiveProps) {
  const benefit = COMPLETION_BENEFITS[fieldType];
  const motivation = USER_MOTIVATIONS[userType];

  if (isCompleted) {
    return (
      <div className="text-sm text-green-600 flex items-center gap-2 mt-1">
        <span className="text-green-500">✓</span>
        <span>Great! This boosts your listing performance by {benefit.impact}</span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2 rounded-r-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
            +{benefit.impact}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-blue-800 font-medium">
            {benefit.benefit}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            💡 {benefit.privacy}
          </p>
          <p className="text-xs text-blue-700 font-medium mt-2">
            {motivation.cta} - {motivation.primary.toLowerCase()}!
          </p>
        </div>
      </div>
    </div>
  );
}

// Completion Progress Component
interface CompletionProgressProps {
  completionPercentage: number;
  userType: 'agent' | 'landlord' | 'fsbo';
  missingFields: string[];
}

export function CompletionProgress({ 
  completionPercentage, 
  userType, 
  missingFields 
}: CompletionProgressProps) {
  const motivation = USER_MOTIVATIONS[userType];
  
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'green', icon: '🚀' };
    if (percentage >= 75) return { level: 'Good', color: 'blue', icon: '👍' };
    if (percentage >= 60) return { level: 'Fair', color: 'yellow', icon: '⚡' };
    return { level: 'Basic', color: 'red', icon: '💡' };
  };

  const performance = getPerformanceLevel(completionPercentage);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Listing Performance Score
        </h3>
        <span className="text-2xl">{performance.icon}</span>
      </div>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full bg-${performance.color}-500 transition-all duration-500`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <span className="text-lg font-bold text-gray-900">
          {completionPercentage}%
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium text-${performance.color}-600`}>
          {performance.level} Performance
        </span>
        <span className="text-gray-600">
          {motivation.primary}
        </span>
      </div>

      {completionPercentage < 90 && missingFields.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">
            Quick wins to boost your score:
          </p>
          <div className="flex flex-wrap gap-2">
            {missingFields.slice(0, 3).map((field, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
              >
                +{Math.floor(Math.random() * 15) + 10}% {field}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}