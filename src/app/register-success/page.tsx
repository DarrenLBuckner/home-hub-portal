import Image from 'next/image';

export default function RegisterSuccess() {
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
        {/* Professional red house-shaped logo */}
        <Image src="/red-house-logo.svg" alt="Red House Logo" width={54} height={54} style={{ marginBottom: '1.2rem' }} />
        <h2 style={{ color: '#0a2240', fontWeight: 700, fontSize: '1.35rem', marginBottom: '1.1rem' }}>
          Thanks for registering with Portal Home Hub!
        </h2>
        <p style={{ color: '#1a2a4f', fontSize: '1rem', marginBottom: '0.7rem' }}>
          Please check your email for instructions on how to confirm your account.
        </p>
      </div>
    </div>
  );
}
