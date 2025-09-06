import Link from 'next/link';
import Image from 'next/image';
import styles from './landing/landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <div style={{ marginBottom: '2rem' }}>
  <Image src="/globe.svg" alt="Portal Home Hub Logo" width={64} height={64} />
        <h1 className={styles.title}>Your Home Hub Portal</h1>
        <p className={styles.subtitle}>Connecting agents and sellers to Homehub's real estate market</p>
      </div>
      <section className={styles.actions}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'center',
          marginTop: '2rem',
        }}>
          <Link href="/register" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 w-full sm:w-auto text-center text-lg" style={{ minWidth: 220 }}>Agent Registration</Link>
          <Link href="/register/landlord" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 w-full sm:w-auto text-center text-lg" style={{ minWidth: 220 }}>Landlord Registration</Link>
          <Link href="/register/fsbo" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 w-full sm:w-auto text-center text-lg" style={{ minWidth: 220 }}>For Sale By Owner Registration</Link>
        </div>
      </section>
      <footer className={styles.footer}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>© 2025 Caribbean Home Hub</span>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ color: 'green', fontWeight: 'bold' }}>For Agents</span>
            <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
              <li>
                <a href="https://portalhomehub.com/register" target="_blank" rel="noopener noreferrer">
                  Agent Registration (Portal)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

