'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

// Define the form data structure
interface FranchiseApplicationData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  
  // Geographic Information
  countryOfOrigin: string;
  currentCountry: string;
  targetMarketCountry: string;
  targetMarketRegion: string;
  
  // Professional Background
  currentProfession: string;
  yearsOfExperience: number;
  hasRealEstateExperience: boolean;
  realEstateExperienceDetails: string;
  hasBusinessOwnershipExperience: boolean;
  businessOwnershipDetails: string;
  hasFranchiseExperience: boolean;
  franchiseExperienceDetails: string;
  
  // Financial Information
  netWorthUsd: string;
  investmentCapacity: string;
  fundingSource: string;
  
  // Market Knowledge & Interest
  marketKnowledgeLevel: string;
  whyInterested: string;
  marketResearchCompleted: boolean;
  competitorsIdentified: string;
  
  // Business Goals
  targetLaunchTimeline: string;
  expectedRevenueYearOne: string;
  growthPlans: string;
  
  // Team & Resources
  hasTeamIdentified: boolean;
  teamDetails: string;
  hasOfficeLocation: boolean;
  officeLocationDetails: string;
  marketingExperience: string;
  
  // Commitment & Availability
  fullTimeCommitment: boolean;
  hoursPerWeek: number;
  otherBusinessCommitments: string;
}

const initialFormData: FranchiseApplicationData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  countryOfOrigin: '',
  currentCountry: '',
  targetMarketCountry: '',
  targetMarketRegion: '',
  currentProfession: '',
  yearsOfExperience: 0,
  hasRealEstateExperience: false,
  realEstateExperienceDetails: '',
  hasBusinessOwnershipExperience: false,
  businessOwnershipDetails: '',
  hasFranchiseExperience: false,
  franchiseExperienceDetails: '',
  netWorthUsd: '',
  investmentCapacity: '',
  fundingSource: '',
  marketKnowledgeLevel: '',
  whyInterested: '',
  marketResearchCompleted: false,
  competitorsIdentified: '',
  targetLaunchTimeline: '',
  expectedRevenueYearOne: '',
  growthPlans: '',
  hasTeamIdentified: false,
  teamDetails: '',
  hasOfficeLocation: false,
  officeLocationDetails: '',
  marketingExperience: '',
  fullTimeCommitment: false,
  hoursPerWeek: 0,
  otherBusinessCommitments: ''
};

export default function FranchiseApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FranchiseApplicationData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalSteps = 6;

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleInputChange = (field: keyof FranchiseApplicationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/franchise-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      // Handle error (show error message to user)
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Personal Information';
      case 2: return 'Geographic Details';
      case 3: return 'Professional Background';
      case 4: return 'Financial Information';
      case 5: return 'Market Knowledge & Goals';
      case 6: return 'Team & Commitment';
      default: return '';
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur rounded-lg p-8 max-w-2xl mx-4 text-center border border-slate-700">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-white mb-4">Application Submitted Successfully!</h1>
          <p className="text-slate-300 mb-6">
            Thank you for your interest in partnering with Portal Home Hub. 
            We'll review your application and get back to you within 2-3 business days.
          </p>
          <div className="space-y-4">
            <p className="text-blue-400 font-medium">
              📧 A confirmation email has been sent to {formData.email}
            </p>
            <Link
              href="/franchise"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Back to Franchise Information
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/franchise"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            <span className="mr-1">←</span>
            Back to Franchise Information
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Franchise Application
          </h1>
          <p className="text-slate-300">
            Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto bg-slate-800/50 backdrop-blur rounded-lg p-6 md:p-8 border border-slate-700">
          {currentStep === 1 && (
            <PersonalInformationStep 
              data={formData} 
              onChange={handleInputChange} 
            />
          )}
          
          {currentStep === 2 && (
            <GeographicDetailsStep 
              data={formData} 
              onChange={handleInputChange} 
            />
          )}
          
          {currentStep === 3 && (
            <ProfessionalBackgroundStep 
              data={formData} 
              onChange={handleInputChange} 
            />
          )}
          
          {currentStep === 4 && (
            <FinancialInformationStep 
              data={formData} 
              onChange={handleInputChange} 
            />
          )}
          
          {currentStep === 5 && (
            <MarketKnowledgeStep 
              data={formData} 
              onChange={handleInputChange} 
            />
          )}
          
          {currentStep === 6 && (
            <TeamCommitmentStep 
              data={formData} 
              onChange={handleInputChange} 
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-600">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              <span className="mr-2">←</span>
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Next
                <span className="ml-2">→</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function PersonalInformationStep({ data, onChange }: { 
  data: FranchiseApplicationData; 
  onChange: (field: keyof FranchiseApplicationData, value: any) => void; 
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white font-medium mb-2">First Name *</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">Last Name *</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white font-medium mb-2">Email Address *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">Phone Number *</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Date of Birth</label>
        <input
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => onChange('dateOfBirth', e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

function GeographicDetailsStep({ data, onChange }: { 
  data: FranchiseApplicationData; 
  onChange: (field: keyof FranchiseApplicationData, value: any) => void; 
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Geographic Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white font-medium mb-2">Country of Origin *</label>
          <input
            type="text"
            value={data.countryOfOrigin}
            onChange={(e) => onChange('countryOfOrigin', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g., Trinidad & Tobago"
            required
          />
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">Current Country *</label>
          <input
            type="text"
            value={data.currentCountry}
            onChange={(e) => onChange('currentCountry', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g., Canada"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white font-medium mb-2">Target Market Country *</label>
          <input
            type="text"
            value={data.targetMarketCountry}
            onChange={(e) => onChange('targetMarketCountry', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g., Barbados"
            required
          />
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">Target Market Region/City</label>
          <input
            type="text"
            value={data.targetMarketRegion}
            onChange={(e) => onChange('targetMarketRegion', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g., Bridgetown, Christ Church"
          />
        </div>
      </div>
    </div>
  );
}

function ProfessionalBackgroundStep({ data, onChange }: { 
  data: FranchiseApplicationData; 
  onChange: (field: keyof FranchiseApplicationData, value: any) => void; 
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Professional Background</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white font-medium mb-2">Current Profession</label>
          <input
            type="text"
            value={data.currentProfession}
            onChange={(e) => onChange('currentProfession', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g., Real Estate Agent, Business Owner"
          />
        </div>
        
        <div>
          <label className="block text-white font-medium mb-2">Years of Experience</label>
          <input
            type="number"
            value={data.yearsOfExperience}
            onChange={(e) => onChange('yearsOfExperience', parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            min="0"
            max="50"
          />
        </div>
      </div>

      {/* Real Estate Experience */}
      <div>
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={data.hasRealEstateExperience}
            onChange={(e) => onChange('hasRealEstateExperience', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-white font-medium">I have real estate experience</label>
        </div>
        {data.hasRealEstateExperience && (
          <textarea
            value={data.realEstateExperienceDetails}
            onChange={(e) => onChange('realEstateExperienceDetails', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Please describe your real estate experience..."
          />
        )}
      </div>

      {/* Business Ownership Experience */}
      <div>
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={data.hasBusinessOwnershipExperience}
            onChange={(e) => onChange('hasBusinessOwnershipExperience', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-white font-medium">I have business ownership experience</label>
        </div>
        {data.hasBusinessOwnershipExperience && (
          <textarea
            value={data.businessOwnershipDetails}
            onChange={(e) => onChange('businessOwnershipDetails', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Please describe your business ownership experience..."
          />
        )}
      </div>

      {/* Franchise Experience */}
      <div>
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={data.hasFranchiseExperience}
            onChange={(e) => onChange('hasFranchiseExperience', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-white font-medium">I have franchise experience</label>
        </div>
        {data.hasFranchiseExperience && (
          <textarea
            value={data.franchiseExperienceDetails}
            onChange={(e) => onChange('franchiseExperienceDetails', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Please describe your franchise experience..."
          />
        )}
      </div>
    </div>
  );
}

function FinancialInformationStep({ data, onChange }: { 
  data: FranchiseApplicationData; 
  onChange: (field: keyof FranchiseApplicationData, value: any) => void; 
}) {
  const netWorthOptions = [
    { value: 'under_100k', label: 'Under $100,000' },
    { value: '100k_250k', label: '$100,000 - $250,000' },
    { value: '250k_500k', label: '$250,000 - $500,000' },
    { value: '500k_1m', label: '$500,000 - $1,000,000' },
    { value: '1m_2m', label: '$1,000,000 - $2,000,000' },
    { value: '2m_5m', label: '$2,000,000 - $5,000,000' },
    { value: '5m_plus', label: 'Over $5,000,000' }
  ];

  const investmentOptions = [
    { value: 'under_50k', label: 'Under $50,000' },
    { value: '50k_100k', label: '$50,000 - $100,000' },
    { value: '100k_250k', label: '$100,000 - $250,000' },
    { value: '250k_500k', label: '$250,000 - $500,000' },
    { value: '500k_plus', label: 'Over $500,000' }
  ];

  const fundingOptions = [
    { value: 'personal_savings', label: 'Personal Savings' },
    { value: 'bank_loan', label: 'Bank Loan' },
    { value: 'investor_partnership', label: 'Investor Partnership' },
    { value: 'combination', label: 'Combination of Sources' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Financial Information</h2>
      
      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
        <p className="text-blue-200 text-sm">
          💡 All financial information is kept strictly confidential and is used only for qualification purposes.
        </p>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Net Worth (USD) *</label>
        <select
          value={data.netWorthUsd}
          onChange={(e) => onChange('netWorthUsd', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Select your net worth range</option>
          {netWorthOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Investment Capacity</label>
        <select
          value={data.investmentCapacity}
          onChange={(e) => onChange('investmentCapacity', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select your investment capacity</option>
          {investmentOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Primary Funding Source</label>
        <select
          value={data.fundingSource}
          onChange={(e) => onChange('fundingSource', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select your funding source</option>
          {fundingOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function MarketKnowledgeStep({ data, onChange }: { 
  data: FranchiseApplicationData; 
  onChange: (field: keyof FranchiseApplicationData, value: any) => void; 
}) {
  const knowledgeOptions = [
    { value: 'beginner', label: 'Beginner - New to real estate' },
    { value: 'some_knowledge', label: 'Some Knowledge - Basic understanding' },
    { value: 'experienced', label: 'Experienced - Active in real estate' },
    { value: 'expert', label: 'Expert - Extensive real estate experience' }
  ];

  const timelineOptions = [
    { value: 'immediate', label: 'Immediate (Ready now)' },
    { value: '3_months', label: 'Within 3 months' },
    { value: '6_months', label: 'Within 6 months' },
    { value: '12_months', label: 'Within 12 months' },
    { value: '12_plus_months', label: 'More than 12 months' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Market Knowledge & Goals</h2>
      
      <div>
        <label className="block text-white font-medium mb-2">Market Knowledge Level</label>
        <select
          value={data.marketKnowledgeLevel}
          onChange={(e) => onChange('marketKnowledgeLevel', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select your knowledge level</option>
          {knowledgeOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Why are you interested in this franchise opportunity? *</label>
        <textarea
          value={data.whyInterested}
          onChange={(e) => onChange('whyInterested', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          rows={4}
          placeholder="Please share your motivation and goals..."
          required
        />
      </div>

      <div>
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={data.marketResearchCompleted}
            onChange={(e) => onChange('marketResearchCompleted', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-white font-medium">I have completed market research for my target area</label>
        </div>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Competitors Identified</label>
        <textarea
          value={data.competitorsIdentified}
          onChange={(e) => onChange('competitorsIdentified', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          rows={3}
          placeholder="List any competitors you've identified in your target market..."
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Target Launch Timeline</label>
        <select
          value={data.targetLaunchTimeline}
          onChange={(e) => onChange('targetLaunchTimeline', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select your preferred timeline</option>
          {timelineOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Expected Revenue (Year One)</label>
        <input
          type="text"
          value={data.expectedRevenueYearOne}
          onChange={(e) => onChange('expectedRevenueYearOne', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          placeholder="e.g., $250,000 - $500,000"
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Growth Plans</label>
        <textarea
          value={data.growthPlans}
          onChange={(e) => onChange('growthPlans', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          rows={3}
          placeholder="Describe your plans for growing the business..."
        />
      </div>
    </div>
  );
}

function TeamCommitmentStep({ data, onChange }: { 
  data: FranchiseApplicationData; 
  onChange: (field: keyof FranchiseApplicationData, value: any) => void; 
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Team & Commitment</h2>
      
      {/* Team Information */}
      <div>
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={data.hasTeamIdentified}
            onChange={(e) => onChange('hasTeamIdentified', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-white font-medium">I have identified team members</label>
        </div>
        {data.hasTeamIdentified && (
          <textarea
            value={data.teamDetails}
            onChange={(e) => onChange('teamDetails', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Describe your team members and their roles..."
          />
        )}
      </div>

      {/* Office Location */}
      <div>
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={data.hasOfficeLocation}
            onChange={(e) => onChange('hasOfficeLocation', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-white font-medium">I have identified an office location</label>
        </div>
        {data.hasOfficeLocation && (
          <textarea
            value={data.officeLocationDetails}
            onChange={(e) => onChange('officeLocationDetails', e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows={2}
            placeholder="Describe your office location..."
          />
        )}
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Marketing Experience</label>
        <textarea
          value={data.marketingExperience}
          onChange={(e) => onChange('marketingExperience', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          rows={3}
          placeholder="Describe your marketing experience or plans..."
        />
      </div>

      {/* Commitment */}
      <div>
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={data.fullTimeCommitment}
            onChange={(e) => onChange('fullTimeCommitment', e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-white font-medium">I can commit full-time to this franchise</label>
        </div>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Hours per Week Available</label>
        <input
          type="number"
          value={data.hoursPerWeek}
          onChange={(e) => onChange('hoursPerWeek', parseInt(e.target.value))}
          className="w-full md:w-1/2 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          min="0"
          max="168"
          placeholder="40"
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Other Business Commitments</label>
        <textarea
          value={data.otherBusinessCommitments}
          onChange={(e) => onChange('otherBusinessCommitments', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
          rows={3}
          placeholder="Describe any other business commitments you have..."
        />
      </div>

      {/* Final Review Section */}
      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-6 mt-8">
        <h3 className="text-xl font-bold text-white mb-3">Ready to Submit</h3>
        <p className="text-green-200 mb-4">
          Please review all your information before submitting. You can use the "Previous" button to go back and make any changes.
        </p>
        <p className="text-green-200 text-sm">
          📞 After submission, our team will review your application and contact you within 2-3 business days to discuss next steps.
        </p>
      </div>
    </div>
  );
}