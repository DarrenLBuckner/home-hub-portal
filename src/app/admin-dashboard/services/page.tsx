'use client';

import React, { useState, useEffect } from 'react';

/**
 * Admin Services Management Page
 * Allows Super Admin, Owner Admin, and Admin to manage services across all countries
 */

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  icon: string;
  category: string;
  base_price: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  country_services: CountryService[];
}

interface CountryService {
  id: string;
  country_code: string;
  country_name: string;
  is_available: boolean;
  local_price: number;
  local_currency: string;
  contact_email: string;
  contact_phone: string;
}

interface NewService {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  category: string;
  basePrice: number;
  currency: string;
  isActive: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [newService, setNewService] = useState<NewService>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    icon: '',
    category: 'photography',
    basePrice: 0,
    currency: 'USD',
    isActive: true
  });

  const countries = [
    { code: 'all', name: 'All Countries' },
    { code: 'GY', name: 'Guyana' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'BB', name: 'Barbados' }
  ];

  const categories = [
    { value: 'photography', label: 'Photography' },
    { value: 'virtual', label: 'Virtual Tours' },
    { value: 'placement', label: 'Equipment Placement' },
    { value: 'packages', label: 'Service Packages' }
  ];

  const icons = [
    { value: 'camera', label: 'Camera (Photography)' },
    { value: 'drone', label: 'Drone (Aerial)' },
    { value: 'cube', label: 'Cube (3D/Virtual)' },
    { value: 'lock', label: 'Lock (Security)' },
    { value: 'package', label: 'Package (Bundles)' }
  ];

  useEffect(() => {
    fetchServices();
  }, [selectedCountry]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const url = selectedCountry === 'all' 
        ? '/api/admin/services'
        : `/api/admin/services?country=${selectedCountry}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setServices(data.services);
      } else {
        console.error('Failed to fetch services:', data.error);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newService)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewService({
          name: '',
          slug: '',
          description: '',
          shortDescription: '',
          icon: '',
          category: 'photography',
          basePrice: 0,
          currency: 'USD',
          isActive: true
        });
        fetchServices(); // Refresh the list
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Failed to create service');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
          <p className="mt-2 text-gray-600">
            Manage services across all Home Hub websites
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-4">
            <label htmlFor="country-filter" className="text-sm font-medium text-gray-700">
              Filter by Country:
            </label>
            <select
              id="country-filter"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Create New Service
          </button>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading services...</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <span className="text-lg text-emerald-600">
                          {service.icon === 'camera' && '📷'}
                          {service.icon === 'drone' && '🚁'}
                          {service.icon === 'cube' && '🎯'}
                          {service.icon === 'lock' && '🔒'}
                          {service.icon === 'package' && '📦'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{service.category}</p>
                      </div>
                    </div>
                    <div className={`rounded-full px-2 py-1 text-xs font-medium ${
                      service.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                    {service.short_description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Base Price:</span>
                      <span className="ml-2 text-gray-600">
                        {formatPrice(service.base_price, service.currency)}
                      </span>
                    </div>

                    {/* Country Availability */}
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Available in:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {service.country_services
                          .filter(cs => cs.is_available)
                          .map(cs => (
                            <span
                              key={cs.id}
                              className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                            >
                              {cs.country_name}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Edit
                    </button>
                    <button className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Countries
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {services.length === 0 && !loading && (
          <div className="py-12 text-center">
            <p className="text-gray-500">No services found for the selected criteria.</p>
          </div>
        )}
      </div>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Create New Service</h2>
            
            <form onSubmit={handleCreateService} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Service Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newService.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewService({
                        ...newService,
                        name,
                        slug: generateSlug(name)
                      });
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                    Slug
                  </label>
                  <input
                    type="text"
                    id="slug"
                    value={newService.slug}
                    onChange={(e) => setNewService({ ...newService, slug: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="icon" className="block text-sm font-medium text-gray-700">
                    Icon
                  </label>
                  <select
                    id="icon"
                    value={newService.icon}
                    onChange={(e) => setNewService({ ...newService, icon: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select an icon</option>
                    {icons.map(icon => (
                      <option key={icon.value} value={icon.value}>{icon.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
                    Base Price
                  </label>
                  <input
                    type="number"
                    id="basePrice"
                    step="0.01"
                    value={newService.basePrice}
                    onChange={(e) => setNewService({ ...newService, basePrice: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={newService.currency}
                    onChange={(e) => setNewService({ ...newService, currency: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="USD">USD</option>
                    <option value="GYD">GYD</option>
                    <option value="JMD">JMD</option>
                    <option value="BBD">BBD</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">
                  Short Description
                </label>
                <input
                  type="text"
                  id="shortDescription"
                  value={newService.shortDescription}
                  onChange={(e) => setNewService({ ...newService, shortDescription: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  maxLength={500}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Full Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newService.isActive}
                  onChange={(e) => setNewService({ ...newService, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Active (service will be available for use)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}