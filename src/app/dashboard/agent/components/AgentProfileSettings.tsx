import { useState } from 'react';

export default function AgentProfileSettings({ initialWhatsapp = '' }: { initialWhatsapp?: string }) {
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
  // Placeholder for save logic (e.g., Supabase integration)
  const handleSave = () => {
    // Save logic here
    alert('WhatsApp number saved: ' + whatsapp);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Agent Profile Settings</h2>
      <label className="block mb-2 text-sm font-medium text-gray-700">WhatsApp Number</label>
      <input
        type="text"
        value={whatsapp}
        onChange={e => setWhatsapp(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
        placeholder="Enter WhatsApp number"
      />
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        Save
      </button>
    </div>
  );
}
