import React from "react";

type RegistrationFormProps = {
  formData: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  error: string;
};

type PlanSelectionProps = {
  selectedPlan: string;
  setSelectedPlan: React.Dispatch<React.SetStateAction<string>>;
  onContinue: () => void;
  isContinueEnabled: boolean;
  enterpriseStyle?: boolean;
};

export function RegistrationForm({ formData, setFormData, onSubmit, isSubmitting, error }: RegistrationFormProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="text"
        name="firstName"
        value={formData.firstName}
        onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
        placeholder="First Name*"
        required
        minLength={2}
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="text"
        name="lastName"
        value={formData.lastName}
        onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
        placeholder="Last Name*"
        required
        minLength={2}
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
        placeholder="Phone Number*"
        required
        pattern="[0-9]{7,15}"
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
        placeholder="Email Address*"
        required
        className="w-full px-4 py-2 border rounded"
      />
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
          placeholder="Password"
          required
          className="w-full px-4 py-2 border rounded pr-10"
        />
        <button
          type="button"
          className="absolute right-2 top-2 text-gray-500"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <span role="img" aria-label="Hide">🙈</span>
          ) : (
            <span role="img" aria-label="Show">👁️</span>
          )}
        </button>
      </div>
      <div className="relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={e => setFormData(f => ({ ...f, confirmPassword: e.target.value }))}
          placeholder="Confirm Password"
          required
          className="w-full px-4 py-2 border rounded pr-10"
        />
        <button
          type="button"
          className="absolute right-2 top-2 text-gray-500"
          tabIndex={-1}
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
        >
          {showConfirmPassword ? (
            <span role="img" aria-label="Hide">🙈</span>
          ) : (
            <span role="img" aria-label="Show">👁️</span>
          )}
        </button>
      </div>
      <div className="text-xs text-gray-700 mt-1">
        Password requirements:<br />
        &bull; Minimum 8 characters<br />
        &bull; At least one special character (e.g., !@#$%^&*)
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 rounded bg-blue-600 text-white font-semibold ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}
      >
        Submit
      </button>
    </form>
  );
}

export function PlanSelection({ selectedPlan, setSelectedPlan, onContinue, isContinueEnabled, enterpriseStyle }: PlanSelectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-center mb-4 text-gradient bg-gradient-to-r from-orange-500 via-blue-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg">Choose Your Listing Plan</h2>
      <div className="flex gap-6 justify-center">
        <div className={`flex-1 rounded-2xl shadow-xl border-4 p-6 transition-all duration-200 cursor-pointer ${selectedPlan === "basic" ? "border-orange-600 bg-gradient-to-br from-orange-100 to-orange-300" : "border-gray-200 bg-white"}`} onClick={() => setSelectedPlan("basic")}> 
          <div className="text-4xl text-orange-600 mb-2">&#128176;</div>
          <div className="font-bold text-xl text-orange-700 mb-1">FSBO Flat Rate</div>
          <div className="text-lg font-bold text-gray-900 mb-2">G$20,000 / Single Listing</div>
          <ul className="text-sm text-gray-700 mb-2 list-disc list-inside">
            <li>All features included</li>
            <li>5 photos per property</li>
            <li>Basic support</li>
          </ul>
        </div>
        <div className={`flex-1 rounded-2xl shadow-xl border-4 p-6 transition-all duration-200 cursor-pointer relative ${selectedPlan === "extended" ? "border-blue-600 bg-gradient-to-br from-blue-100 to-blue-300" : "border-gray-200 bg-white"}`} onClick={() => setSelectedPlan("extended")}> 
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg z-10">Most Popular</div>
          <div className="text-4xl text-blue-600 mb-2">&#128200;</div>
          <div className="font-bold text-xl text-blue-700 mb-1">Extended Listing</div>
          <div className="text-lg font-bold text-gray-900 mb-2">G$35,000 / 90 Day Access</div>
          <ul className="text-sm text-gray-700 mb-2 list-disc list-inside">
            <li>All features included</li>
            <li>10 photos per property</li>
            <li>Priority support</li>
          </ul>
        </div>
        <div className={`flex-1 rounded-2xl shadow-xl border-4 p-6 transition-all duration-200 cursor-pointer ${selectedPlan === "premium" ? "border-yellow-500 bg-gradient-to-br from-yellow-100 to-yellow-300" : "border-gray-200 bg-white"}`} onClick={() => setSelectedPlan("premium")}> 
          <div className="text-4xl text-yellow-500 mb-2">&#11088;</div>
          <div className="font-bold text-xl text-yellow-700 mb-1">Premium Listing</div>
          <div className="text-lg font-bold text-gray-900 mb-2">G$65,000 / 180 Day Access</div>
          <ul className="text-sm text-gray-700 mb-2 list-disc list-inside">
            <li>All features included</li>
            <li>15 photos per property</li>
            <li>Premium support</li>
          </ul>
        </div>
      </div>
      <button
        type="button"
        disabled={!isContinueEnabled}
        onClick={onContinue}
        className={`w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 via-blue-500 to-yellow-500 text-white font-bold text-lg shadow-lg transition-all duration-200 ${!isContinueEnabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
      >
        Registration & Continue
      </button>
      <div className="text-center text-sm text-gray-800 mt-2">
        Enter your information below and submit to unlock plan selection.
      </div>
    </div>
  );
}
