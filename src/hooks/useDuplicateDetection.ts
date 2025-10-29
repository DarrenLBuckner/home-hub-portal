import { useState, useEffect } from 'react';
import { createClient } from '@/supabase';

interface DuplicateProperty {
  id: string;
  title: string;
  created_at: string;
  listing_type: string;
  price: number;
  location?: string;
}

interface UseDuplicateDetectionReturn {
  isChecking: boolean;
  potentialDuplicate: DuplicateProperty | null;
  showDuplicateWarning: boolean;
  setShowDuplicateWarning: (show: boolean) => void;
  checkForDuplicates: (title: string, strict?: boolean) => Promise<boolean>;
  resetDuplicateState: () => void;
}

export function useDuplicateDetection(): UseDuplicateDetectionReturn {
  const supabase = createClient();
  const [isChecking, setIsChecking] = useState(false);
  const [potentialDuplicate, setPotentialDuplicate] = useState<DuplicateProperty | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Function to check for potential duplicates
  const checkForDuplicates = async (title: string, strict: boolean = false): Promise<boolean> => {
    if (!title || title.length < 5) return false;

    setIsChecking(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check for exact or similar title in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: similarProperties } = await supabase
        .from('properties')
        .select('id, title, created_at, listing_type, price, location')
        .eq('user_id', user.id)
        .gte('created_at', oneDayAgo)
        .ilike('title', `%${title}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (similarProperties && similarProperties.length > 0) {
        const duplicate = similarProperties[0];
        
        if (strict) {
          // For strict check (during submission), show warning
          setPotentialDuplicate(duplicate);
          setShowDuplicateWarning(true);
          return true;
        } else {
          // For soft check (while typing), just log
          console.log('Potential duplicate detected:', duplicate.title);
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const resetDuplicateState = () => {
    setPotentialDuplicate(null);
    setShowDuplicateWarning(false);
  };

  return {
    isChecking,
    potentialDuplicate,
    showDuplicateWarning,
    setShowDuplicateWarning,
    checkForDuplicates,
    resetDuplicateState,
  };
}