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
  location?: string;
  region?: string;
  city?: string;
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

// Field weights based on impact on property performance
const FIELD_WEIGHTS = {
  // Essential fields (higher weight)
  title: 15,
  description: 15,
  images: 20,
  price: 15,
  
  // Important fields (medium weight)
  location: 10,
  house_size_value: 8,
  amenities: 7,
  
  // Helpful fields (lower weight)
  year_built: 5,
  region: 3,
  city: 2
};

// Recommendations based on missing fields
const FIELD_RECOMMENDATIONS = {
  location: {
    impact: "85%",
    suggestion: "Add area or neighborhood (e.g., 'Near Main St' for privacy)"
  },
  house_size_value: {
    impact: "73%", 
    suggestion: "Approximate size helps buyers understand space"
  },
  year_built: {
    impact: "62%",
    suggestion: "Even approximate age builds buyer confidence"
  },
  amenities: {
    impact: "91%",
    suggestion: "List 3-5 key features that make this property special"
  },
  images: {
    impact: "95%",
    suggestion: "Add 8+ photos showing different rooms and exterior"
  },
  description: {
    impact: "78%",
    suggestion: "Detailed description attracts serious inquiries"
  }
};

export function calculateCompletionScore(formData: PropertyFormData): CompletionAnalysis {
  const completedFields: string[] = [];
  const missingFields: string[] = [];
  let totalWeight = 0;
  let completedWeight = 0;

  // Check each field
  Object.entries(FIELD_WEIGHTS).forEach(([field, weight]) => {
    totalWeight += weight;
    
    const value = formData[field as keyof PropertyFormData];
    const isCompleted = checkFieldCompletion(field, value);
    
    if (isCompleted) {
      completedFields.push(field);
      completedWeight += weight;
    } else {
      missingFields.push(field);
    }
  });

  const percentage = Math.round((completedWeight / totalWeight) * 100);

  // Generate recommendations for missing high-impact fields
  const recommendations = missingFields
    .filter(field => FIELD_RECOMMENDATIONS[field as keyof typeof FIELD_RECOMMENDATIONS])
    .slice(0, 3) // Top 3 recommendations
    .map(field => ({
      field,
      impact: FIELD_RECOMMENDATIONS[field as keyof typeof FIELD_RECOMMENDATIONS].impact,
      suggestion: FIELD_RECOMMENDATIONS[field as keyof typeof FIELD_RECOMMENDATIONS].suggestion
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
    case 'images':
      return Array.isArray(value) && value.length >= 3;
    case 'amenities':
      return Array.isArray(value) && value.length > 0;
    case 'description':
      return typeof value === 'string' && value.length >= 50;
    case 'title':
      return typeof value === 'string' && value.length >= 10;
    default:
      return value !== undefined && value !== null && value !== '';
  }
}

// Get user-specific messaging
export function getUserMotivation(userType: 'agent' | 'landlord' | 'fsbo') {
  const motivations = {
    agent: {
      primary: "Close deals faster and maximize commissions",
      urgency: "Complete listings sell 67% faster",
      social: "Top agents always provide complete information"
    },
    landlord: {
      primary: "Reduce vacancy time and find quality tenants",
      urgency: "Complete listings rent 58% quicker",
      social: "Professional landlords provide comprehensive details"
    },
    fsbo: {
      primary: "Sell for full market value without agent fees",
      urgency: "Detailed FSBO listings compete with agent listings",
      social: "Successful FSBO sellers provide complete information"
    }
  };

  return motivations[userType];
}

// Performance benchmarks
export function getPerformanceBenchmark(percentage: number, userType: string) {
  if (percentage >= 90) {
    return {
      level: 'Professional',
      message: `Your listing meets professional ${userType} standards!`,
      color: 'green',
      nextGoal: 'Perfect! Consider adding virtual tour for premium appeal.'
    };
  }
  
  if (percentage >= 75) {
    return {
      level: 'Good',
      message: 'Good progress! A few more details will maximize performance.',
      color: 'blue', 
      nextGoal: 'Add missing details to reach professional level.'
    };
  }
  
  if (percentage >= 60) {
    return {
      level: 'Basic',
      message: 'Your listing covers the basics. More details = more interest!',
      color: 'yellow',
      nextGoal: 'Focus on high-impact fields like photos and amenities.'
    };
  }
  
  return {
    level: 'Incomplete',
    message: 'Adding more details will significantly boost performance.',
    color: 'red',
    nextGoal: 'Complete essential fields to attract serious buyers.'
  };
}