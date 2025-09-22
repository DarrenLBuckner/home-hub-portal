"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { createClient } from '@/supabase';

export default function LogoutPage() {
  useEffect(() => {
    // Ensure user is completely signed out when visiting this page
    const handleSignOut = async () => {
      console.log('💨 Logout page: Ensuring complete signout');
      const supabase = createClient();
      
      try {
        // Force signout with global scope
        await supabase.auth.signOut({ scope: 'global' });
        console.log('✅ Logout page: Session cleared');
        
        // Clear browser storage
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          console.log('🧹 Logout page: Browser storage cleared');
        }
      } catch (error) {
        console.error('❌ Logout page error:', error);
        // Clear storage even if signout fails
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
      }
    };
    
    handleSignOut();
  }, []);
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a2240 0%, #1a2a4f 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        boxShadow: '0 4px 32px rgba(10,34,64,0.12)',
        padding: '2.5rem 2rem',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
  <Image src="/images/PHH Logo.png" alt="Portal Home Hub Logo" width={72} height={72} style={{ marginBottom: '1.2rem' }} />
        <h2 style={{ color: '#0a2240', fontWeight: 700, fontSize: '1.35rem', marginBottom: '1.1rem' }}>
          You have been logged out
        </h2>
        <p style={{ color: '#1a2a4f', fontSize: '1rem', marginBottom: '1.2rem' }}>
          Thank you for using Portal Home Hub.<br />
          Choose how you'd like to log back in.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.2rem' }}>
          <Link href="/login" style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, #14b8a6, #0a2240)',
            color: '#fff',
            fontWeight: 'bold',
            padding: '10px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '1rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(20,184,166,0.12)',
          }}>
            Agent / Owner / Landlord Login
          </Link>
          <Link href="/admin-login" style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
            color: '#fff',
            fontWeight: 'bold',
            padding: '10px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '1rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,0.12)',
          }}>
            Admin Login
          </Link>
          <Link href="/" style={{
            display: 'inline-block',
            background: '#f3f4f6',
            color: '#374151',
            fontWeight: 'bold',
            padding: '10px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '1rem',
            textAlign: 'center',
            border: '1px solid #d1d5db',
          }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
