// Property Completion Utilities
// Calculate completion percentages and provide smart incentives

export interface PropertyFormData {
  title?: string;
  description?: string;
  price?: string;
  property_type?: string;
  bedrooms?: string;
  bathrooms?: string;
  house_size_value?: string;
  land_size_value?: string;
  land_size_na?: boolean;
  location?: string;
  region?: string;
  city?: string;
  neighborhood?: string;
  year_built?: string;
  amenities?: string[];
  images?: File[];
  owner_email?: string;
  owner_whatsapp?: string;
}

export interface CompletionAnalysis {
  percentage: number;
  missingFields: string[];
  completedFields: string[];
  recommendations: Array<{
    field: string;
    impact: string;
    suggestion: string;
  }>;
}

// Field weights - designed so filling everything = 100%
// Base: 75 points, Bonus: 25 points for completeness
const FIELD_WEIGHTS = {
  // Core fields (must-haves)
  title: 8,
  description: 8,
  price: 8,
  images: 12,

  // Property specs
  bedrooms: 5,
  bathrooms: 5,
  house_size_value: 5,
  year_built: 4,

  // Location
  region: 5,
  neighborhood: 6,

  // Features
  amenities: 9,
};

// Recommendations based on missing fields
const FIELD_RECOMMENDATIONS: Record<string, { impact: string; suggestion: string }> = {
  images: {
    impact: "+12%",
    suggestion: "Add 5+ photos - listings with photos get 10x more views"
  },
  amenities: {
    impact: "+9%",
    suggestion: "Select amenities - each one helps buyers find your listing"
  },
  description: {
    impact: "+8%",
    suggestion: "Add a description - use AI to generate one quickly"
  },
  neighborhood: {
    impact: "+6%",
    suggestion: "Add neighborhood - helps buyers understand the area"
  },
  bedrooms: {
    impact: "+5%",
    suggestion: "Add bedrooms - essential for search filters"
  },
  bathrooms: {
    impact: "+5%",
    suggestion: "Add bathrooms - buyers filter by this"
  },
  house_size_value: {
    impact: "+5%",
    suggestion: "Add size - helps buyers compare properties"
  },
  year_built: {
    impact: "+4%",
    suggestion: "Add year built - builds buyer confidence"
  }
};

export function calculateCompletionScore(formData: PropertyFormData): CompletionAnalysis {
  const completedFields: string[] = [];
  const missingFields: string[] = [];
  let totalWeight = 0;
  let completedWeight = 0;

  // Calculate base score from each field
  Object.entries(FIELD_WEIGHTS).forEach(([field, weight]) => {
    totalWeight += weight;

    const value = formData[field as keyof PropertyFormData];

    if (field === 'amenities') {
      const amenitiesScore = getAmenitiesScore(value as string[], weight);
      completedWeight += amenitiesScore;
      if (amenitiesScore > 0) {
        completedFields.push(field);
      } else {
        missingFields.push(field);
      }
    } else if (field === 'images') {
      const imageScore = getImageScore(value as File[], weight);
      completedWeight += imageScore;
      if (imageScore > 0) {
        completedFields.push(field);
      } else {
        missingFields.push(field);
      }
    } else {
      const isCompleted = checkFieldCompletion(field, value);
      if (isCompleted) {
        completedFields.push(field);
        completedWeight += weight;
      } else {
        missingFields.push(field);
      }
    }
  });

  // COMPLETENESS BONUS: Reward filling ALL fields
  // If you fill 90%+ of fields, get bonus points to push toward 100%
  const fieldCompletionRatio = completedFields.length / Object.keys(FIELD_WEIGHTS).length;
  let bonusPoints = 0;

  if (fieldCompletionRatio >= 1.0) {
    // Everything filled = +25 bonus (hits 100%)
    bonusPoints = 25;
  } else if (fieldCompletionRatio >= 0.9) {
    // 90%+ fields = +15 bonus
    bonusPoints = 15;
  } else if (fieldCompletionRatio >= 0.8) {
    // 80%+ fields = +8 bonus
    bonusPoints = 8;
  } else if (fieldCompletionRatio >= 0.7) {
    // 70%+ fields = +3 bonus
    bonusPoints = 3;
  }

  // Calculate final percentage (base + bonus, capped at 100)
  const basePercentage = Math.round((completedWeight / totalWeight) * 75); // Base max is 75%
  const percentage = Math.min(100, basePercentage + bonusPoints);

  // Generate recommendations for missing fields (sorted by impact)
  const recommendations = missingFields
    .filter(field => FIELD_RECOMMENDATIONS[field])
    .sort((a, b) => {
      const weightA = FIELD_WEIGHTS[a as keyof typeof FIELD_WEIGHTS] || 0;
      const weightB = FIELD_WEIGHTS[b as keyof typeof FIELD_WEIGHTS] || 0;
      return weightB - weightA; // Higher weight = higher priority
    })
    .slice(0, 3)
    .map(field => ({
      field,
      impact: FIELD_RECOMMENDATIONS[field].impact,
      suggestion: FIELD_RECOMMENDATIONS[field].suggestion
    }));

  return {
    percentage,
    missingFields,
    completedFields,
    recommendations
  };
}

function checkFieldCompletion(field: string, value: any): boolean {
  switch (field) {
    case 'description':
      return typeof value === 'string' && value.trim().length >= 30;
    case 'title':
      return typeof value === 'string' && value.trim().length >= 5;
    case 'neighborhood':
      return typeof value === 'string' && value.trim().length >= 2;
    default:
      return value !== undefined && value !== null && value !== '';
  }
}

// Image scoring - progressive rewards
function getImageScore(images: File[], maxWeight: number): number {
  if (!Array.isArray(images) || images.length === 0) return 0;

  // 1 image = 40%, 3 images = 70%, 5+ images = 100% of weight
  if (images.length >= 5) return maxWeight;
  if (images.length >= 3) return Math.round(maxWeight * 0.7);
  return Math.round(maxWeight * 0.4);
}

// Amenities scoring - progressive rewards
function getAmenitiesScore(amenities: string[], maxWeight: number): number {
  if (!Array.isArray(amenities) || amenities.length === 0) return 0;

  // 1-2 amenities = 50%, 3-4 = 75%, 5+ = 100% of weight
  if (amenities.length >= 5) return maxWeight;
  if (amenities.length >= 3) return Math.round(maxWeight * 0.75);
  return Math.round(maxWeight * 0.5);
}

// Get user-specific messaging
export function getUserMotivation(userType: 'agent' | 'landlord' | 'fsbo') {
  const motivations = {
    agent: {
      primary: "Close deals faster",
      urgency: "Complete listings sell 67% faster",
      social: "Top agents provide complete info"
    },
    landlord: {
      primary: "Find quality tenants faster",
      urgency: "Complete listings rent 58% quicker",
      social: "Professional landlords provide details"
    },
    fsbo: {
      primary: "Sell for full market value",
      urgency: "Detailed listings compete with agent listings",
      social: "Successful sellers provide complete info"
    }
  };

  return motivations[userType];
}

// Performance benchmarks
export function getPerformanceBenchmark(percentage: number, userType: string) {
  if (percentage >= 95) {
    return {
      level: 'Complete',
      message: 'Your listing is fully complete!',
      color: 'green',
      nextGoal: 'Ready to publish - this listing will perform well.'
    };
  }

  if (percentage >= 85) {
    return {
      level: 'Professional',
      message: 'Almost there! Just a few more details.',
      color: 'blue',
      nextGoal: 'Fill remaining fields to hit 100%.'
    };
  }

  if (percentage >= 70) {
    return {
      level: 'Good',
      message: 'Good progress - a bit more will boost performance.',
      color: 'yellow',
      nextGoal: 'Add photos and amenities for best results.'
    };
  }

  if (percentage >= 50) {
    return {
      level: 'Basic',
      message: 'Covers basics. More details = more interest.',
      color: 'orange',
      nextGoal: 'Focus on photos, description, and amenities.'
    };
  }

  return {
    level: 'Incomplete',
    message: 'Add more details to attract buyers.',
    color: 'red',
    nextGoal: 'Complete the essential fields first.'
  };
}
