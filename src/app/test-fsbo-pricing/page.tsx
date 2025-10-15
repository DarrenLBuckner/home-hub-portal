"use client";
import React, { useState } from 'react';
import FSBORegistrationNew from '@/components/FSBORegistrationNew';

export default function TestFSBOPricing() {
  const [currentView, setCurrentView] = useState<'plans' | 'form'>('plans');
  const [selectedPlan, setSelectedPlan] = useState('featured'); // Default to most popular
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = () => {
    console.log('Selected plan:', selectedPlan);
    setCurrentView('form');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsSubmitting(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }
    
    // Simulate form submission
    console.log('Form submitted with:', { formData, selectedPlan });
    
    setTimeout(() => {
      alert(`✅ Test submission successful!\\nPlan: ${selectedPlan}\\nEmail: ${formData.email}\\nThis is just a test - no actual account was created.`);
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Test Header */}
      <div className="bg-yellow-100 border-b-2 border-yellow-300 p-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-yellow-800">
            🧪 TEST PAGE - New FSBO Pricing Component
          </h1>
          <p className="text-yellow-700 text-sm mt-1">
            Testing 4-tier FSBO pricing structure • This is NOT the live registration page
          </p>
          <div className="mt-2 text-xs text-yellow-600">
            Database: ✅ Updated | Component: ✅ Created | Phone: +592 762-9797
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-center space-x-4">
          <button
            onClick={() => setCurrentView('plans')}
            className={`px-4 py-2 rounded-lg font-medium ${
              currentView === 'plans' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📋 Plan Selection
          </button>
          <button
            onClick={() => setCurrentView('form')}
            className={`px-4 py-2 rounded-lg font-medium ${
              currentView === 'form' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📝 Registration Form
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Plan Selection View */}
        {currentView === 'plans' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                New FSBO Pricing Structure
              </h2>
              <p className="text-gray-600">
                4-tier pricing in GYD (Guyana Dollars) with enterprise support
              </p>
            </div>
            
            <FSBORegistrationNew.PlanSelection
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onContinue={handleContinue}
              isContinueEnabled={!!selectedPlan}
            />
          </div>
        )}

        {/* Registration Form View */}
        {currentView === 'form' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Create Your FSBO Account
                </h2>
                <p className="text-sm text-gray-600">
                  Selected Plan: <span className="font-medium text-blue-600">{selectedPlan}</span>
                </p>
                <button
                  onClick={() => setCurrentView('plans')}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  ← Change Plan
                </button>
              </div>
              
              <FSBORegistrationNew.RegistrationForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={error}
              />
            </div>
          </div>
        )}
      </div>

      {/* Test Info Footer */}
      <div className="bg-gray-100 border-t p-4 mt-8">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-600">
          <p>
            <strong>Test Status:</strong> Database migration ✅ | Component created ✅ | Ready for integration testing
          </p>
          <p className="mt-1">
            <strong>Next:</strong> Test complete FSBO flow → Admin approval → Consumer site visibility
          </p>
        </div>
      </div>
    </div>
  );
}