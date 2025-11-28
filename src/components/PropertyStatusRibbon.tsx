'use client';

interface PropertyStatusRibbonProps {
  status: string;
  listingType?: 'sale' | 'rent';
  className?: string;
}

export function PropertyStatusRibbon({ status, listingType, className = "" }: PropertyStatusRibbonProps) {
  // Priority order: sold > under_contract > active
  // ONLY ONE RIBBON — status overrides listing type
  
  const getRibbonConfig = () => {
    // Sold takes highest priority
    if (status === 'sold') {
      return { 
        text: 'SOLD', 
        color: 'bg-red-600 text-white',
        shadowColor: 'shadow-red-600/25' 
      };
    }
    
    // Under contract / pending takes second priority
    if (status === 'under_contract') {
      return { 
        text: 'PENDING', 
        color: 'bg-orange-500 text-white',
        shadowColor: 'shadow-orange-500/25' 
      };
    }
    
    // Active — show listing type
    if (status === 'active') {
      if (listingType === 'rent') {
        return { 
          text: 'FOR RENT', 
          color: 'bg-blue-600 text-white',
          shadowColor: 'shadow-blue-600/25' 
        };
      }
      return { 
        text: 'FOR SALE', 
        color: 'bg-green-600 text-white',
        shadowColor: 'shadow-green-600/25' 
      };
    }
    
    // Draft or other statuses - shouldn't show on public site
    return null;
  };

  const config = getRibbonConfig();
  
  if (!config) return null;

  // Corner ribbon style - positioned absolutely from top-left
  return (
    <div className={`absolute top-3 left-3 z-20 ${className}`}>
      <div className={`${config.color} text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg ${config.shadowColor} transform transition-transform hover:scale-105`}>
        {config.text}
      </div>
    </div>
  );
}

// Alternative diagonal corner ribbon (optional)
export function PropertyStatusRibbonDiagonal({ status, listingType, className = "" }: PropertyStatusRibbonProps) {
  const getRibbonConfig = () => {
    if (status === 'sold') {
      return { text: 'SOLD', color: 'bg-red-600' };
    }
    if (status === 'under_contract') {
      return { text: 'PENDING', color: 'bg-orange-500' };
    }
    if (status === 'active') {
      if (listingType === 'rent') {
        return { text: 'FOR RENT', color: 'bg-blue-600' };
      }
      return { text: 'FOR SALE', color: 'bg-green-600' };
    }
    return null;
  };

  const config = getRibbonConfig();
  if (!config) return null;

  // Diagonal corner ribbon
  return (
    <div className={`absolute top-0 left-0 overflow-hidden w-20 h-20 z-20 ${className}`}>
      <div className={`${config.color} text-white text-[10px] font-bold text-center transform -rotate-45 -translate-x-6 translate-y-5 w-28 py-1 shadow-lg`}>
        {config.text}
      </div>
    </div>
  );
}