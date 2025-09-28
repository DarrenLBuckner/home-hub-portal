"use client";
import dynamic from 'next/dynamic';

// Use the super simple, user-friendly pricing interface
const SuperSimplePricingManagement = dynamic(
  () => import('./super-simple-page'),
  { ssr: false }
);

export default function AdminPricingManagement() {
  return <SuperSimplePricingManagement />;
}