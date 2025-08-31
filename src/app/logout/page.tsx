import Link from 'next/link';
import Image from 'next/image';

export default function LogoutPage() {
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
          To access your account again, please log in below.
        </p>
        <Link href="/login" style={{
          display: 'inline-block',
          background: 'linear-gradient(90deg, #14b8a6, #0a2240)',
          color: '#fff',
          fontWeight: 'bold',
          padding: '12px 32px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '1.1rem',
          boxShadow: '0 2px 8px rgba(20,184,166,0.12)',
          marginTop: '1.2rem',
        }}>
          Log Back In
        </Link>
      </div>
    </div>
  );
}
