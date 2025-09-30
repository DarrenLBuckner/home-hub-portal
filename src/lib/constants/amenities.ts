export const AMENITIES_CATEGORIES = [
  {
    id: 'climate',
    name: 'Climate & Comfort',
    amenities: [
      { id: 'ac', label: 'Air Conditioning' },
      { id: 'ceiling_fans', label: 'Ceiling Fans' },
      { id: 'solar_power', label: 'Solar Panels/Backup Power' },
      { id: 'water_heater', label: 'Water Heater (Solar/Electric)' },
      { id: 'cross_ventilation', label: 'Cross-Ventilation/Large Windows' }
    ]
  },
  {
    id: 'water',
    name: 'Water & Utilities',
    amenities: [
      { id: 'piped_water', label: 'Piped Water Connection' },
      { id: 'rainwater', label: 'Rainwater Harvesting' },
      { id: 'water_tank', label: 'Water Storage Tank' },
      { id: 'borehole', label: 'Borehole/Well' },
      { id: 'indoor_plumbing', label: 'Indoor Plumbing' },
      { id: 'septic_tank', label: 'Septic Tank/Sewer Connection' }
    ]
  },
  {
    id: 'security',
    name: 'Safety & Security',
    amenities: [
      { id: 'fenced', label: 'Fenced Yard/Perimeter Wall' },
      { id: 'security_gate', label: 'Security Gate' },
      { id: 'burglar_bars', label: 'Burglar Bars/Security Grills' },
      { id: 'alarm_system', label: 'Alarm System/CCTV' },
      { id: 'gated_community', label: 'Gated Community' }
    ]
  },
  {
    id: 'outdoor',
    name: 'Outdoor & Lifestyle',
    amenities: [
      { id: 'porch', label: 'Front Porch/Veranda' },
      { id: 'balcony', label: 'Balcony/Rooftop Space' },
      { id: 'outdoor_kitchen', label: 'Outdoor Kitchen' },
      { id: 'garden', label: 'Garden/Yard Space' },
      { id: 'fruit_trees', label: 'Fruit Trees' },
      { id: 'parking', label: 'Parking' },
      { id: 'pool', label: 'Swimming Pool' }
    ]
  },
  {
    id: 'interior',
    name: 'Interior Features',
    amenities: [
      { id: 'modern_kitchen', label: 'Modern Kitchen' },
      { id: 'built_in_closets', label: 'Built-in Closets' },
      { id: 'tiled_floors', label: 'Tiled Floors' },
      { id: 'internet_ready', label: 'Internet/Fiber Optic Ready' },
      { id: 'laundry', label: 'Laundry Area' },
      { id: 'furnished', label: 'Furnished' }
    ]
  },
  {
    id: 'structural',
    name: 'Structural & Lot Details',
    amenities: [
      { id: 'concrete_construction', label: 'Concrete Construction' },
      { id: 'raised_foundation', label: 'Raised Foundation' },
      { id: 'multiple_storeys', label: 'Multiple Storeys' }
    ]
  }
];

// Flat list of all amenities for easier access
export const ALL_AMENITIES = AMENITIES_CATEGORIES.flatMap(category => 
  category.amenities
);