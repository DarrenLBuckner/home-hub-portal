import Link from 'next/link';
import Image from 'next/image';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Image src="/globe.svg" alt="Guyana Home Hub Logo" width={64} height={64} />
        <h1 className={styles.title}>Your Home Hub Portal</h1>
        <p className={styles.subtitle}>Connecting agents and sellers to Homehub's real estate market</p>
      </header>
      <section className={styles.actions}>
        <Link href="/login" className={styles.button}>Login</Link>
        <Link href="/register" className={styles.buttonSecondary}>Register</Link>
      </section>
      <footer className={styles.footer}>
        <span>© 2025 Caribbean Home Hub</span>
      </footer>
    </main>
  );
}
