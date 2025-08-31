// ...existing code from landlord.tsx...
"use client";
import React, { useState } from "react";

export default function LandlordRegistrationPage() {
  const [formData, setFormData] = useState({
    propertyTitle: "",
    description: "",
    location: "",
    monthlyRent: "",
    securityDeposit: "",
    leaseTerms: "",
    petPolicy: "",
    features: [] as string[],
  });

  const handleFeatureToggle = (feature: string) => {
    const current = formData.features || [];
    if (current.includes(feature)) {
      setFormData({ ...formData, features: current.filter((f: string) => f !== feature) });
    } else {
      setFormData({ ...formData, features: [...current, feature] });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">Choose Your Landlord Listing Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col items-center hover:shadow-xl transition-all">
          <h3 className="text-lg font-bold text-green-700 mb-2">Basic Landlord</h3>
          <div className="text-2xl font-extrabold text-green-700 mb-1">G$5,200<span className="text-base font-normal">/30 days</span></div>
          <ul className="mb-4 text-gray-700 text-sm space-y-1">
            <li>Perfect for new landlords</li>
            <li>1 active rental listing</li>
            <li>5 photos per property</li>
            <li>Basic support</li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col items-center hover:shadow-xl transition-all">
          <h3 className="text-lg font-bold text-blue-700 mb-2">Featured Landlord</h3>
          <div className="text-2xl font-extrabold text-blue-700 mb-1">G$7,300<span className="text-base font-normal">/60 days</span></div>
          <ul className="mb-4 text-gray-700 text-sm space-y-1">
            <li>Feature your rental for more visibility</li>
            <li>3 active rental listings</li>
            <li>10 photos per property</li>
            <li>Priority support</li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col items-center hover:shadow-xl transition-all">
          <h3 className="text-lg font-bold text-yellow-700 mb-2">Premium Landlord</h3>
          <div className="text-2xl font-extrabold text-yellow-700 mb-1">G$12,500<span className="text-base font-normal">/90 days</span></div>
          <ul className="mb-4 text-gray-700 text-sm space-y-1">
            <li>Best value for experienced landlords</li>
            <li>Unlimited rental listings*</li>
            <li>15 photos per property</li>
            <li>Premium support</li>
          </ul>
        </div>
      </div>
      <form className="space-y-6">
        <input
          type="text"
          name="propertyTitle"
          value={formData.propertyTitle}
          onChange={handleChange}
          placeholder="Property Title"
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Property Description (Powered by AI)"
          className="w-full px-4 py-2 border border-gray-300 rounded"
          rows={4}
        />
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Location / Region"
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />
        <input
          type="number"
          name="monthlyRent"
          value={formData.monthlyRent}
          onChange={handleChange}
          placeholder="Monthly Rent (GYD)"
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />
        <input
          type="number"
          name="securityDeposit"
          value={formData.securityDeposit}
          onChange={handleChange}
          placeholder="Security Deposit (GYD)"
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />
        <div>
          <label className="block mb-1 font-medium">Lease Terms</label>
          <select
            name="leaseTerms"
            value={formData.leaseTerms}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded"
          >
            <option value="">Select lease terms</option>
            <option value="month-to-month">Month-to-Month</option>
            <option value="6-months">6 Months</option>
            <option value="1-year">1 Year</option>
            <option value="2-years">2 Years</option>
            <option value="flexible">Flexible Terms</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Pet Policy</label>
          <select
            name="petPolicy"
            value={formData.petPolicy}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded"
          >
            <option value="">Select pet policy</option>
            <option value="no-pets">No Pets</option>
            <option value="cats-only">Cats Only</option>
            <option value="dogs-only">Dogs Only</option>
            <option value="pets-allowed">Pets Allowed</option>
            <option value="negotiable">Negotiable</option>
          </select>
        </div>
        {/* Property Features Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Property Features</h4>
          {/* Features Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-3">Features</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["Pet Friendly", "Garden", "Pool", "Security Estate", "AC", "Security System", "Fenced", "Backup Generator", "Garage", "Furnished"].map((feature) => (
                <label key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                  />
                  <span className="text-sm">{feature}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Other Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-3">Other</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["WiFi", "Cable TV", "Kitchen Appliances", "Washing Machine"].map((feature) => (
                <label key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                  />
                  <span className="text-sm">{feature}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded"
          >
            List My Property
          </button>
        </div>
      </form>
    </div>
  );
}
