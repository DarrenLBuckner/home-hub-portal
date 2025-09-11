"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function ConfirmEmailSuccess() {
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
        {/* Portal Home Hub logo */}
        <Image src="/portal-logo.svg" alt="Portal Home Hub Logo" width={72} height={72} style={{ marginBottom: '1.2rem' }} />
        <h2 style={{ color: '#0a2240', fontWeight: 700, fontSize: '1.35rem', marginBottom: '1.1rem' }}>
          Thanks for confirming your email address.
        </h2>
        <p style={{ color: '#1a2a4f', fontSize: '1rem', marginBottom: '1.2rem' }}>
          Please log in.
        </p>
        <Link href="/login" style={{ color: '#0a5cff', fontWeight: 600, fontSize: '1.08rem', textDecoration: 'underline' }}>
          Log in
        </Link>
      </div>
    </div>
  );
}
