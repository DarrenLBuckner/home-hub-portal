import React, { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

interface Property {
  id: string;
  title: string;
  description: string;
  features: string[];
  created_at: string;
  status: string;
}

const PropertyList: React.FC<{ userId: string }> = ({ userId }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setProperties(data || []);
      }
      setLoading(false);
    };
    fetchProperties();
  }, [userId]);

  if (loading) return <div>Loading properties...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!properties.length) return <div className="text-gray-500">No properties found for your account.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">Title</th>
            <th className="px-4 py-2 border-b">Description</th>
            <th className="px-4 py-2 border-b">Features</th>
            <th className="px-4 py-2 border-b">Status</th>
            <th className="px-4 py-2 border-b">Created</th>
            <th className="px-4 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id}>
              <td className="px-4 py-2 border-b">{property.title}</td>
              <td className="px-4 py-2 border-b">{property.description}</td>
              <td className="px-4 py-2 border-b">{property.features?.join(', ')}</td>
              <td className="px-4 py-2 border-b">
                <select
                  value={property.status}
                  onChange={async (e) => {
                    const supabase = createClient();
                    await supabase
                      .from('properties')
                      .update({ status: e.target.value })
                      .eq('id', property.id);
                    // Optionally, refresh properties list after update
                    setProperties((prev) =>
                      prev.map((p) =>
                        p.id === property.id ? { ...p, status: e.target.value } : p
                      )
                    );
                  }}
                  className="border rounded px-2 py-1"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                </select>
              </td>
              <td className="px-4 py-2 border-b">{new Date(property.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-2 border-b">
                {/* Edit/Delete buttons will be added here */}
                <button className="mr-2 text-blue-600 hover:underline">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PropertyList;
