"use client";
import React, { useState } from "react";
import { RegistrationForm, PlanSelection } from "@/components/FSBORegistration";

export default function FSBORegistrationPage() {
  const [step, setStep] = useState<'register' | 'plan'>('register');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedPlan, setSelectedPlan] = useState('extended');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Registration form handlers


  // Registration submit logic
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
      const response = await fetch('/api/register/fsbo', {
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
      sessionStorage.setItem('fsboRegistration', JSON.stringify({
        userId: data.user.id,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: selectedPlan
      }));
      
      setIsSubmitting(false);
      setStep('plan'); // Move to plan selection step after registration
    } catch (error: any) {
      setError(error.message);
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    // You can add logic here to handle plan selection and next steps
    alert(`Plan selected: ${selectedPlan}`);
  }
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-xl space-y-8">
      <h1 className="text-3xl font-extrabold text-center text-orange-600 mb-2 tracking-tight drop-shadow-lg animate-fade-in">For Sale By Owner Listing Plans & Registration</h1>
      {/* Always show plan cards at the top */}
      {/* Registration step */}
      {step === 'register' && (
        <>
          <div className="mb-8">
            <PlanSelection
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onContinue={() => {}}
              isContinueEnabled={false}
              enterpriseStyle={true}
            />
          </div>
          <RegistrationForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleRegistrationSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </>
      )}
      {/* Plan selection step */}
      {step === 'plan' && (
        <div className="mt-6">
          <PlanSelection
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            onContinue={() => window.location.href = '/register/payment'}
            isContinueEnabled={!!selectedPlan}
            enterpriseStyle={true}
          />
        </div>
      )}
    </div>
  );
}
