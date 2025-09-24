import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-5 text-center">
      <header className="mb-10">
        <Image src="/globe.svg" alt="Portal Home Hub Logo" width={64} height={64} />
        <h1 className="text-5xl font-bold my-5 text-gray-800">Your Home Hub Portal</h1>
        <p className="text-xl text-gray-600 mb-10">Connecting agents and sellers to Homehub's real estate market</p>
      </header>
      <section className="flex gap-5 mb-10">
        <Link href="/login" className="px-6 py-3 bg-blue-600 text-white no-underline rounded-lg text-base hover:bg-blue-700 transition-colors">
          Login
        </Link>
        <Link href="/register" className="px-6 py-3 bg-transparent text-blue-600 no-underline border border-blue-600 rounded-lg text-base hover:bg-blue-600 hover:text-white transition-all">
          Register
        </Link>
      </section>
      <footer className="mt-auto text-gray-600 text-sm">
        <span>© 2025 Caribbean Home Hub</span>
      </footer>
    </main>
  );
}
