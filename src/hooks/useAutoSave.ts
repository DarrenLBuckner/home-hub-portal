// Auto-save hook for property creation forms
// Automatically saves draft data to prevent data loss
import { useEffect, useRef, useCallback } from 'react';

// Simple debounce implementation to avoid lodash dependency
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout;
  
  const debounced = ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };
  
  return debounced;
}

interface AutoSaveOptions {
  data: any;
  onSave: (data: any, isDraft?: boolean) => Promise<{ success: boolean; draftId?: string; error?: string }>;
  interval?: number; // milliseconds between auto-saves
  enabled?: boolean;
  onSaveStart?: () => void;
  onSaveComplete?: (success: boolean, draftId?: string) => void;
  minFieldsRequired?: number; // minimum filled fields before auto-saving
}

export function useAutoSave({
  data,
  onSave,
  interval = 30000, // 30 seconds default
  enabled = true,
  onSaveStart,
  onSaveComplete,
  minFieldsRequired = 3
}: AutoSaveOptions) {
  const lastSavedData = useRef<any>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const isSaving = useRef(false);

  // Count non-empty fields to determine if we should auto-save
  const countFilledFields = useCallback((formData: any): number => {
    if (!formData) return 0;
    
    let count = 0;
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value) && value.length > 0) {
        count++;
      } else if (key === 'amenities' && Array.isArray(value) && value.length > 0) {
        count++;
      } else if (value && value !== '' && value !== '0') {
        count++;
      }
    });
    
    return count;
  }, []);

  // Check if data has changed significantly
  const hasSignificantChanges = useCallback((currentData: any, lastData: any): boolean => {
    if (!lastData) return true;
    
    // Compare key fields that indicate meaningful progress
    const keyFields = [
      'title', 'description', 'price', 'property_type', 'listing_type',
      'bedrooms', 'bathrooms', 'region', 'city', 'images', 'amenities'
    ];
    
    return keyFields.some(field => {
      const current = currentData[field];
      const last = lastData[field];
      
      if (Array.isArray(current) && Array.isArray(last)) {
        return current.length !== last.length || 
               current.some((item, index) => item !== last[index]);
      }
      
      return current !== last;
    });
  }, []);

  // Debounced save function to avoid too frequent saves
  const debouncedSave = useCallback(
    debounce(async (formData: any) => {
      if (isSaving.current || !enabled) return;
      
      const filledFields = countFilledFields(formData);
      if (filledFields < minFieldsRequired) {
        console.log('⏸️ Auto-save skipped: insufficient data', { filledFields, minFieldsRequired });
        return;
      }
      
      if (!hasSignificantChanges(formData, lastSavedData.current)) {
        console.log('⏸️ Auto-save skipped: no significant changes');
        return;
      }
      
      console.log('💾 Auto-saving draft...', { filledFields });
      isSaving.current = true;
      onSaveStart?.();
      
      try {
        const result = await onSave(formData, true); // true = isDraft
        
        if (result.success) {
          lastSavedData.current = { ...formData };
          console.log('✅ Auto-save successful', { draftId: result.draftId });
          onSaveComplete?.(true, result.draftId);
        } else {
          console.error('❌ Auto-save failed:', result.error);
          onSaveComplete?.(false);
        }
      } catch (error) {
        console.error('❌ Auto-save error:', error);
        onSaveComplete?.(false);
      } finally {
        isSaving.current = false;
      }
    }, 2000), // 2 second debounce
    [enabled, onSave, onSaveStart, onSaveComplete, countFilledFields, hasSignificantChanges, minFieldsRequired]
  );

  // Set up auto-save timer
  useEffect(() => {
    if (!enabled || !data) return;
    
    // Clear existing timer
    if (autoSaveTimer.current) {
      clearInterval(autoSaveTimer.current);
    }
    
    // Set up new timer
    autoSaveTimer.current = setInterval(() => {
      debouncedSave(data);
    }, interval);
    
    return () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
    };
  }, [data, enabled, interval, debouncedSave]);

  // Trigger auto-save when data changes (with debounce)
  useEffect(() => {
    if (enabled && data) {
      debouncedSave(data);
    }
  }, [data, enabled, debouncedSave]);

  // Save before page unload
  useEffect(() => {
    if (!enabled) return;
    
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const filledFields = countFilledFields(data);
      if (filledFields >= minFieldsRequired && hasSignificantChanges(data, lastSavedData.current)) {
        // Attempt synchronous save
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // Try to save immediately (though this may not complete)
        onSave(data, true).catch(console.error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [data, enabled, onSave, countFilledFields, hasSignificantChanges, minFieldsRequired]);

  // Manual trigger for immediate save
  const triggerSave = useCallback(async (): Promise<boolean> => {
    if (isSaving.current || !data) return false;
    
    try {
      debouncedSave.cancel(); // Cancel any pending debounced saves
      const result = await onSave(data, true);
      if (result.success) {
        lastSavedData.current = { ...data };
      }
      return result.success;
    } catch {
      return false;
    }
  }, [data, onSave, debouncedSave]);

  return {
    triggerSave,
    isSaving: isSaving.current,
    filledFieldsCount: countFilledFields(data),
    hasUnsavedChanges: hasSignificantChanges(data, lastSavedData.current)
  };
}