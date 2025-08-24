import React, { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

const statusColors: { [key: string]: string } = {
  Draft: 'bg-gray-200 text-gray-700',
  Active: 'bg-green-100 text-green-700',
  Sold: 'bg-red-100 text-red-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

const typeIcons: { [key: string]: string } = {
  house: '🏠',
  apartment: '🏢',
  condo: '🏬',
  commercial: '🏭',
  land: '🌳',
};

function formatPrice(price: number): string {
  return `G$${price.toLocaleString('en-US')}`;
}

const PropertyList: React.FC<{ userId: string }> = ({ userId }) => {
  const [properties, setProperties] = useState<any[]>([]);
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property: any) => {
        const statusClass = statusColors[property.status as string] || 'bg-gray-100 text-gray-700';
        const typeIcon = typeIcons[(property.property_type as string)?.toLowerCase()] || '🏠';
        const imageUrl = property.images && property.images.length > 0 ? property.images[0] : 'https://placehold.co/400x300?text=No+Image';
        return (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden flex flex-col"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={imageUrl}
                alt={property.title}
                className="object-cover w-full h-full"
              />
              <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{property.status}</span>
              <span className="absolute top-3 right-3 text-2xl">{typeIcon}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 truncate">{property.title}</h3>
                <span className="text-blue-700 font-semibold">{formatPrice(property.price)}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{property.location}</div>
              <div className="flex items-center gap-4 mb-2">
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="bed">🛏️</span> {property.bedrooms}</span>
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="bath">🛁</span> {property.bathrooms}</span>
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="sqft">📏</span> {property.square_footage} sqft</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {property.features?.map((feature: string) => (
                  <span key={feature} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{feature}</span>
                ))}
              </div>
              <div className="mt-auto flex gap-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">Edit</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyList;
import React, { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

const statusColors: { [key: string]: string } = {
  Draft: 'bg-gray-200 text-gray-700',
  Active: 'bg-green-100 text-green-700',
  Sold: 'bg-red-100 text-red-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

const typeIcons: { [key: string]: string } = {
  house: '🏠',
  apartment: '🏢',
  condo: '🏬',
  commercial: '🏭',
  land: '🌳',
function formatPrice(price: number) {
  return `G$${price.toLocaleString('en-US')}`;
}

const PropertyList: React.FC<{ userId: string }> = ({ userId }) => {
  const [properties, setProperties] = useState<any[]>([]);
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property: any) => {
        const statusClass = statusColors[property.status as string] || 'bg-gray-100 text-gray-700';
        const typeIcon = typeIcons[(property.property_type as string)?.toLowerCase()] || '🏠';
        const imageUrl = property.images && property.images.length > 0 ? property.images[0] : 'https://placehold.co/400x300?text=No+Image';
        return (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden flex flex-col"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={imageUrl}
                alt={property.title}
                className="object-cover w-full h-full"
              <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{property.status}</span>
              <span className="absolute top-3 right-3 text-2xl">{typeIcon}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 truncate">{property.title}</h3>
                <span className="text-blue-700 font-semibold">{formatPrice(property.price)}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{property.location}</div>
              <div className="flex items-center gap-4 mb-2">
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="bed">🛏️</span> {property.bedrooms}</span>
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="bath">🛁</span> {property.bathrooms}</span>
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="sqft">📏</span> {property.square_footage} sqft</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {property.features?.map((feature: string) => (
                  <span key={feature} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{feature}</span>
                ))}
              </div>
              <div className="mt-auto flex gap-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">Edit</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyList;
import React, { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

const PropertyList: React.FC<{ userId: string }> = ({ userId }) => {
  const [properties, setProperties] = useState<any[]>([]);
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property: any) => {
        const statusClass = statusColors[String(property.status)] || 'bg-gray-100 text-gray-700';
        const typeIcon = typeIcons[String(property.property_type)?.toLowerCase()] || '🏠';
        const imageUrl = property.images && property.images.length > 0 ? property.images[0] : 'https://placehold.co/400x300?text=No+Image';
        return (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden flex flex-col"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={imageUrl}
                alt={property.title}
                className="object-cover w-full h-full"
              />
              <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{property.status}</span>
              <span className="absolute top-3 right-3 text-2xl">{typeIcon}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 truncate">{property.title}</h3>
                <span className="text-blue-700 font-semibold">{formatPrice(property.price)}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{property.location}</div>
              <div className="flex items-center gap-4 mb-2">
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="bed">🛏️</span> {property.bedrooms}</span>
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="bath">🛁</span> {property.bathrooms}</span>
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="sqft">📏</span> {property.square_footage} sqft</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {property.features?.map((feature: string) => (
                  <span key={feature} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{feature}</span>
                ))}
              </div>
              <div className="mt-auto flex gap-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">Edit</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyList;
import React, { useEffect, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

const statusColors = {
  Draft: 'bg-gray-200 text-gray-700',
  Active: 'bg-green-100 text-green-700',
  Sold: 'bg-red-100 text-red-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

const typeIcons = {
  house: '🏠',
  apartment: '🏢',
  condo: '🏬',
  commercial: '🏭',
  land: '🌳',
};

function formatPrice(price: number) {
  return `G$${price.toLocaleString('en-US')}`;
};

export default PropertyList;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => {
        const statusClass = statusColors[property.status] || 'bg-gray-100 text-gray-700';
        const typeIcon = typeIcons[property.property_type?.toLowerCase()] || '🏠';
        const imageUrl = property.images && property.images.length > 0 ? property.images[0] : 'https://placehold.co/400x300?text=No+Image';
        return (
          <div
            key={property.id}
            className="bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 overflow-hidden flex flex-col"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={imageUrl}
                alt={property.title}
                className="object-cover w-full h-full"
              />
              <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{property.status}</span>
              <span className="absolute top-3 right-3 text-2xl">{typeIcon}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 truncate">{property.title}</h3>
                <span className="text-blue-700 font-semibold">{formatPrice(property.price)}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{property.location}</div>
              <div className="flex items-center gap-4 mb-2">
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="bed">🛏️</span> {property.bedrooms}</span>
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="bath">🛁</span> {property.bathrooms}</span>
                <span className="flex items-center gap-1 text-gray-700"><span role="img" aria-label="sqft">📏</span> {property.square_footage} sqft</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {property.features?.map((feature: string) => (
                  <span key={feature} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{feature}</span>
                ))}
              </div>
              <div className="mt-auto flex gap-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">Edit</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyList;
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
