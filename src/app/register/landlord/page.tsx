"use client";
import React, { useState } from "react";

export default function LandlordRegistrationPage() {
  const [step, setStep] = useState<'register' | 'plan'>('register');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleRegistrationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }
    
    if (formData.password.length < 8 || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError("Password must be at least 8 characters with at least one special character");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await fetch('/api/register/landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          plan: selectedPlan,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Store registration data for payment page
      sessionStorage.setItem('landlordRegistration', JSON.stringify({
        userId: data.user.id,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: selectedPlan
      }));
      
      setIsSubmitting(false);
      setStep('plan'); // Move to plan confirmation step after registration
    } catch (error: any) {
      setError(error.message);
      setIsSubmitting(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-xl space-y-8">
      <h1 className="text-3xl font-extrabold text-center text-blue-600 mb-2 tracking-tight drop-shadow-lg animate-fade-in">
        Landlord Registration & Plans
      </h1>
      
      {/* Registration step */}
      {step === 'register' && (
        <>
          {/* Plan Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">Choose Your Landlord Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                className={`bg-white rounded-2xl shadow-lg border-2 p-6 flex flex-col items-center hover:shadow-xl transition-all cursor-pointer ${
                  selectedPlan === 'basic' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('basic')}
              >
                <input
                  type="radio"
                  name="plan"
                  value="basic"
                  checked={selectedPlan === 'basic'}
                  onChange={() => setSelectedPlan('basic')}
                  className="mb-2"
                />
                <h3 className="text-lg font-bold text-green-700 mb-2">Basic Landlord</h3>
                <div className="text-2xl font-extrabold text-green-700 mb-1">
                  G$5,200<span className="text-base font-normal">/30 days</span>
                </div>
                <ul className="mb-4 text-gray-700 text-sm space-y-1 text-center">
                  <li>Perfect for new landlords</li>
                  <li>1 active rental listing</li>
                  <li>5 photos per property</li>
                  <li>Basic support</li>
                </ul>
              </div>
              
              <div 
                className={`bg-white rounded-2xl shadow-lg border-2 p-6 flex flex-col items-center hover:shadow-xl transition-all cursor-pointer ${
                  selectedPlan === 'featured' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('featured')}
              >
                <input
                  type="radio"
                  name="plan"
                  value="featured"
                  checked={selectedPlan === 'featured'}
                  onChange={() => setSelectedPlan('featured')}
                  className="mb-2"
                />
                <h3 className="text-lg font-bold text-blue-700 mb-2">Featured Landlord</h3>
                <div className="text-2xl font-extrabold text-blue-700 mb-1">
                  G$7,300<span className="text-base font-normal">/60 days</span>
                </div>
                <ul className="mb-4 text-gray-700 text-sm space-y-1 text-center">
                  <li>Feature your rental for more visibility</li>
                  <li>3 active rental listings</li>
                  <li>10 photos per property</li>
                  <li>Priority support</li>
                </ul>
              </div>
              
              <div 
                className={`bg-white rounded-2xl shadow-lg border-2 p-6 flex flex-col items-center hover:shadow-xl transition-all cursor-pointer ${
                  selectedPlan === 'premium' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedPlan('premium')}
              >
                <input
                  type="radio"
                  name="plan"
                  value="premium"
                  checked={selectedPlan === 'premium'}
                  onChange={() => setSelectedPlan('premium')}
                  className="mb-2"
                />
                <h3 className="text-lg font-bold text-yellow-700 mb-2">Premium Landlord</h3>
                <div className="text-2xl font-extrabold text-yellow-700 mb-1">
                  G$12,500<span className="text-base font-normal">/90 days</span>
                </div>
                <ul className="mb-4 text-gray-700 text-sm space-y-1 text-center">
                  <li>Best value for experienced landlords</li>
                  <li>Unlimited rental listings*</li>
                  <li>15 photos per property</li>
                  <li>Premium support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegistrationSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name*"
                required
                minLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name*"
                required
                minLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>
            
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address*"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number*"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password* (min 8 chars with special character)"
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password*"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            
            {error && (
              <div className="text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg py-3 rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200"
            >
              {isSubmitting ? "Creating Account..." : "Create Landlord Account"}
            </button>
          </form>
        </>
      )}
      
      {/* Plan confirmation step */}
      {step === 'plan' && (
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-green-700 mb-2">Registration Successful!</h2>
            <p className="text-gray-700">
              Your account has been created. Your selected plan: <strong>{selectedPlan}</strong>
            </p>
          </div>
          
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Continue to Login
          </button>
          
          <p className="text-sm text-gray-500">
            After login, you can access your dashboard to create property listings.
          </p>
        </div>
      )}
    </div>
  );
}
