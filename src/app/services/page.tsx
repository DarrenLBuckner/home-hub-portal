import React from 'react';
import { Metadata } from 'next';
import ServicesOverview from '@/components/services/ServicesOverview';
import PageTracker from '@/components/PageTracker';

export const metadata: Metadata = {
  title: 'Professional Real Estate Services | Portal Home Hub',
  description: 'Professional drone photography, property photography, 3D virtual tours, lockbox placement, and complete listing services for your property.',
  keywords: 'drone photography, property photography, 3D virtual tours, lockbox services, real estate marketing, professional services'
};

/**
 * Main Professional Services Page for Portal Home Hub
 * Showcases all available services with lead capture functionality
 */
export default function ServicesPage() {
  return (
    <>
      <PageTracker path="/services" />
      <ServicesOverview />
    </>
  );
}