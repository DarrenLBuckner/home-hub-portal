import Link from 'next/link';
import Image from 'next/image';
import styles from './landing/landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      {/* Mobile-Optimized Header */}
      <div className={styles.mobileHeader}>
        <Image src="/globe.svg" alt="Portal Home Hub Logo" width={48} height={48} className={styles.logo} />
        <h1 className={styles.mobileTitle}>Portal Home Hub</h1>
        <p className={styles.mobileSubtitle}>Professional Real Estate Management</p>
      </div>

      {/* Mobile-Optimized Registration Cards */}
      <section className={styles.mobileActions}>
        <div className={styles.registrationGrid}>
          
          {/* Agent Registration Card */}
          <div className={styles.registrationCard}>
            <div className={styles.cardIcon}>🏢</div>
            <h3 className={styles.cardTitle}>Real Estate Agent</h3>
            <p className={styles.cardDescription}>Manage sales & rentals with professional tools</p>
            <Link href="/register" className={styles.primaryButton}>
              Get Started
            </Link>
            <span className={styles.pricing}>Subscription: $49-99/month</span>
          </div>

          {/* Landlord Registration Card */}
          <div className={styles.registrationCard}>
            <div className={styles.cardIcon}>🏠</div>
            <h3 className={styles.cardTitle}>Property Owner</h3>
            <p className={styles.cardDescription}>Rent out your properties easily</p>
            <Link href="/register/landlord" className={styles.primaryButton}>
              Get Started
            </Link>
            <span className={styles.pricing}>Per listing: $79-149</span>
          </div>

          {/* FSBO Registration Card */}
          <div className={styles.registrationCard}>
            <div className={styles.cardIcon}>🏆</div>
            <h3 className={styles.cardTitle}>Sell By Owner</h3>
            <p className={styles.cardDescription}>Sell your property without an agent</p>
            <Link href="/register/fsbo" className={styles.primaryButton}>
              Get Started
            </Link>
            <span className={styles.pricing}>Per listing: $99-199</span>
          </div>

        </div>

        {/* Existing User Section */}
        <div className={styles.existingUserSection}>
          <p className={styles.existingUserText}>Already have an account?</p>
          <Link href="/login" className={styles.secondaryButton}>
            Sign In
          </Link>
        </div>
      </section>

      {/* Mobile-Friendly Footer */}
      <footer className={styles.mobileFooter}>
        <div className={styles.footerContent}>
          <p>© 2025 Caribbean Home Hub</p>
        </div>
      </footer>
    </div>
  );
}

