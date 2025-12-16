import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';

const statusColors: { [key: string]: string } = {
  off_market: 'bg-gray-600 text-white',
  active: 'bg-green-600 text-white',
  available: 'bg-green-600 text-white',
  under_contract: 'bg-[#F97316] text-white',
  sold: 'bg-[#DC2626] text-white',
  rented: 'bg-[#2563EB] text-white',
  pending: 'bg-yellow-500 text-white',
  rejected: 'bg-red-600 text-white',
  draft: 'bg-blue-500 text-white',
};

const statusMessages: { [key: string]: string } = {
  sold: 'This property has been sold',
  rented: 'This property has been rented',
  under_contract: 'This property is under contract',
  active: 'Live listing',
  available: 'Live listing',
  pending: 'Awaiting admin approval',
  rejected: 'Property was rejected',
  draft: 'Draft - complete and submit',
  off_market: 'Hidden from public view',
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    if (!error) {
      setProperties((prev) => prev.filter((p) => p.id !== id));
    }
    setDeletingId(null);
  };

  const handleEdit = (id: string) => {
    window.location.href = `/dashboard/agent/edit-property/${id}`;
  };

  const updatePropertyStatus = async (propertyId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId)
        .eq('user_id', userId);

      if (error) {
        alert('Error updating property status');
        console.error(error);
      } else {
        const statusMessage = newStatus === 'sold' ? 'marked as sold! Listing complete.' : 
                             newStatus === 'rented' ? 'marked as rented! Listing complete.' : 
                             'status updated successfully!';
        alert(`Property ${statusMessage}`);
        
        // Refresh properties list
        const { data, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (!fetchError) {
          setProperties(data || []);
        }
      }
    } catch (error) {
      alert('Error updating property');
      console.error(error);
    }
  };

  if (loading) return <div>Loading properties...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!properties || !properties.length) return <div className="text-gray-500">No properties found for your account.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {(properties || []).map((property: any) => {
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
                className={`object-cover w-full h-full ${['sold', 'rented', 'under_contract'].includes(property.status) ? 'opacity-70' : ''}`}
              />
              <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                {property.status === 'active' ? 'LIVE' : 
                 property.status === 'under_contract' ? 'UNDER CONTRACT' : 
                 property.status === 'pending' ? 'PENDING APPROVAL' : 
                 property.status === 'sold' ? 'SOLD' : 
                 property.status === 'rented' ? 'RENTED' : 
                 property.status === 'off_market' ? 'HIDDEN' :
                 property.status === 'rejected' ? 'REJECTED' :
                 property.status === 'draft' ? 'DRAFT' :
                 'UNKNOWN'}
              </span>
              
              {/* FSBO Badge - positioned below status badge */}
              {(property.listed_by_type === 'owner' || property.listed_by_type === 'fsbo') && (
                <span className="absolute top-12 left-3 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 shadow-sm">
                  For Sale By Owner
                </span>
              )}
              
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
              <div className="mt-auto space-y-2">
                {/* Property Status Management */}
                <div className="flex gap-2 flex-wrap text-xs">
                  {property.status === 'active' && (
                    <>
                      <button 
                        onClick={() => updatePropertyStatus(property.id, 'under_contract')}
                        className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                        disabled={deletingId === property.id}
                      >
                        📝 Mark Under Contract
                      </button>
                      {property.listing_type === 'rental' ? (
                        <button 
                          onClick={() => updatePropertyStatus(property.id, 'rented')}
                          className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          disabled={deletingId === property.id}
                        >
                          🏠 Mark Rented
                        </button>
                      ) : (
                        <button 
                          onClick={() => updatePropertyStatus(property.id, 'sold')}
                          className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          disabled={deletingId === property.id}
                        >
                          🏆 Mark Sold
                        </button>
                      )}
                    </>
                  )}
                  {property.status === 'pending' && (
                    <>
                      {property.listing_type === 'rental' ? (
                        <button 
                          onClick={() => updatePropertyStatus(property.id, 'rented')}
                          className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          disabled={deletingId === property.id}
                        >
                          🏠 Mark Rented
                        </button>
                      ) : (
                        <button 
                          onClick={() => updatePropertyStatus(property.id, 'sold')}
                          className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          disabled={deletingId === property.id}
                        >
                          🏆 Mark Sold
                        </button>
                      )}
                      <button 
                        onClick={() => updatePropertyStatus(property.id, 'active')}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        disabled={deletingId === property.id}
                      >
                        ↩️ Back to Market
                      </button>
                    </>
                  )}
                  
                  {/* Under Contract Properties */}
                  {property.status === 'under_contract' && (
                    <>
                      {property.listing_type === 'rental' ? (
                        <button 
                          onClick={() => updatePropertyStatus(property.id, 'rented')}
                          className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          disabled={deletingId === property.id}
                        >
                          🏠 Completed - Rented
                        </button>
                      ) : (
                        <button 
                          onClick={() => updatePropertyStatus(property.id, 'sold')}
                          className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          disabled={deletingId === property.id}
                        >
                          🏆 Completed - Sold
                        </button>
                      )}
                      <button 
                        onClick={() => updatePropertyStatus(property.id, 'active')}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        disabled={deletingId === property.id}
                      >
                        ↩️ Back to Market
                      </button>
                    </>
                  )}
                  {(property.status === 'sold' || property.status === 'rented') && (
                    <div className="space-y-2">
                      <div className={`font-semibold ${property.status === 'sold' ? 'text-[#DC2626]' : 'text-[#2563EB]'}`}>
                        {statusMessages[property.status]}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          disabled
                          className="px-2 py-1 bg-gray-400 text-white rounded cursor-not-allowed opacity-50 text-xs"
                        >
                          📝 Mark Under Contract
                        </button>
                        <button
                          disabled
                          className="px-2 py-1 bg-gray-400 text-white rounded cursor-not-allowed opacity-50 text-xs"
                        >
                          {property.listing_type === 'rental' ? '🏠 Mark Rented' : '🏆 Mark Sold'}
                        </button>
                      </div>
                    </div>
                  )}
                  {property.status === 'off_market' && (
                    <div className="text-yellow-600 font-semibold">
                      ⏳ Awaiting admin approval to go live
                    </div>
                  )}
                </div>
                
                {/* Edit and Delete buttons */}
                <div className="flex gap-2">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    onClick={() => handleEdit(property.id)}
                    disabled={deletingId === property.id}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                    onClick={() => handleDelete(property.id)}
                    disabled={deletingId === property.id}
                  >
                    {deletingId === property.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyList;
