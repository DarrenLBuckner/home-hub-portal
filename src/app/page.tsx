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

        {/* Browse Properties Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Button 1: Browse Properties for Sale */}
            <Link 
              href="/properties/buy"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 text-center"
            >
              🏠 Browse Properties for Sale
            </Link>

            {/* Button 2: Browse Properties for Rent */}
            <Link 
              href="/properties/rent"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 text-center"
            >
              🏘️ Browse Properties for Rent
            </Link>

          </div>
          
          {/* List Property Button - Secondary Style */}
          <div className="mt-6">
            <Link 
              href="/register"
              className="w-full md:w-auto mx-auto block bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 font-semibold py-3 px-8 rounded-lg shadow transition-all duration-300 text-center"
            >
              📝 List My Property (Free)
            </Link>
          </div>
        </div>

        {/* Existing User Section */}
        <div className={styles.existingUserSection}>
          <p className="text-white text-base font-semibold mb-4">Already have an account?</p>
          <Link href="/login" className="inline-block bg-transparent text-yellow-300 border-2 border-yellow-300 hover:bg-yellow-300 hover:text-gray-900 px-6 py-3 rounded-xl font-bold text-base transition-all duration-200 min-h-[48px] flex items-center justify-center">
            🔑 Sign In
          </Link>
        </div>
      </section>

      {/* Mobile-Friendly Footer */}
      <footer className={styles.mobileFooter}>
        <div className={styles.footerContent}>
          <p>© 2025 Caribbean Home Hub</p>
          <div className="mt-4">
            <a 
              href="https://wa.me/5927629797?text=Hello%20Portal%20Home%20Hub!%20I%20need%20help%20with..." 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mb-3"
            >
              <span className="mr-2">💬</span>
              WhatsApp Support
            </a>
            <p className="text-yellow-200 text-sm font-medium">Chat for fastest response • +592 762-9797</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

