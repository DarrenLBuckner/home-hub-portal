"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CreatePropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClientComponentClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }
    const { error: dbError } = await supabase.from('properties').insert({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      status: form.status,
      agent_id: userData.user.id,
    });
    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard/agent/properties');
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-xl font-bold mb-4 text-primary">Create New Property</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="title"
          type="text"
          placeholder="Property Title"
          value={form.title}
          onChange={handleChange}
          required
          className="border rounded px-3 py-2"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
          className="border rounded px-3 py-2"
        />
        <input
          name="price"
          type="number"
          placeholder="Price (USD)"
          value={form.price}
          onChange={handleChange}
          required
          className="border rounded px-3 py-2"
        />
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="border rounded px-3 py-2"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
        </select>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary-dark transition"
        >
          {loading ? 'Creating...' : 'Create Property'}
        </button>
      </form>
    </div>
  );
}
