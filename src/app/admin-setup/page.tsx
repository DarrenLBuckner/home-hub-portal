'use client';
import { useState } from 'react';

export default function AdminSetupPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const setupQumar = async () => {
    setIsLoading(true);
    setResult('⏳ Setting up Qumar as admin...');
    
    try {
      const response = await fetch('/api/admin/setup-qumar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success! ${data.message}\n\n${JSON.stringify(data, null, 2)}\n\nNext: Qumar can now access the admin dashboard!`);
      } else {
        setResult(`❌ Error: ${data.error}\n\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">🔧 Setup Qumar as Owner Admin</h1>
      <p className="mb-6">Click the button below to update Qumar's profile in the database to admin status.</p>
      
      <button 
        onClick={setupQumar}
        disabled={isLoading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Setting up...' : 'Set Qumar as Owner Admin'}
      </button>
      
      {result && (
        <div className={`mt-6 p-4 rounded border ${
          result.includes('✅') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}