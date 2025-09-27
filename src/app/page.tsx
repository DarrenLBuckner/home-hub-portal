import Link from 'next/link';
import Image from 'next/image';
// import styles from './landing/landing.module.css';

export default function LandingPage() {
  return (
    <div className="">
      {/* Mobile-Optimized Header */}
      <div className="">
        <Image src="/globe.svg" alt="Portal Home Hub Logo" width={48} height={48} className="" />
        <h1 className="">Portal Home Hub</h1>
        <p className="">Professional Real Estate Management</p>
      </div>

      {/* Mobile-Optimized Registration Cards */}
      <section className="">
        <div className="">
          
          {/* Agent Registration Card */}
          <div className="">
            <div className="">🏢</div>
            <h3 className="">Real Estate Agent</h3>
            <p className="">Manage sales & rentals with professional tools</p>
            <Link href="/register" className="">
              Get Started
            </Link>
            <span className="">Subscription: $49-99/month</span>
          </div>

          {/* Landlord Registration Card */}
          <div className="">
            <div className="">🏠</div>
            <h3 className="">Property Owner</h3>
            <p className="">Rent out your properties easily</p>
            <Link href="/register/landlord" className="">
              Get Started
            </Link>
            <span className="">Per listing: $79-149</span>
          </div>

          {/* FSBO Registration Card */}
          <div className="">
            <div className="">🏆</div>
            <h3 className="">Sell By Owner</h3>
            <p className="">Sell your property without an agent</p>
            <Link href="/register/fsbo" className="">
              Get Started
            </Link>
            <span className="">Per listing: $99-199</span>
          </div>

        </div>

        {/* Existing User Section */}
        <div className="">
          <p className="">Already have an account?</p>
          <Link href="/login" className="">
            Sign In
          </Link>
        </div>
      </section>

      {/* Mobile-Friendly Footer */}
      <footer className="">
        <div className="">
          <p>© 2025 Caribbean Home Hub</p>
        </div>
      </footer>
    </div>
  );
}

