import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

type AgentHeaderProps = {
  whatsapp?: string;
};

export default function AgentHeader({ whatsapp }: AgentHeaderProps) {
  const router = useRouter();
  
  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      router.push('/login');
    }
  };
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <img src="/images/PHH Logo.png" alt="Portal Home Hub Logo" className="w-8 h-8 object-contain" style={{ minWidth: 32 }} />
            <h1 className="text-2xl font-bold text-green-700">Portal Home Hub</h1>
          </div>
          <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
            Property Portal
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Welcome to Portal Home Hub!
          </div>
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-700 font-semibold text-sm">U</span>
          </div>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              Message on WhatsApp
            </a>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}