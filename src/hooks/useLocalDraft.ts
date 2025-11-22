// Local storage draft system for property forms
// Perfect for mobile users with poor connectivity - saves directly to phone/device
import { useEffect, useCallback, useState } from 'react';

interface LocalDraftOptions {
  key: string; // Unique key for this form type
  data: any;   // Current form data
  autoSave?: boolean; // Auto-save on data changes (default: true)
  debounceMs?: number; // Debounce time for auto-save (default: 1000ms)
}

export function useLocalDraft({ 
  key, 
  data, 
  autoSave = true, 
  debounceMs = 1000 
}: LocalDraftOptions) {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if draft exists on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem(key);
      setHasDraft(!!draft);
    }
  }, [key]);

  // Save to localStorage
  const saveDraft = useCallback(() => {
    if (typeof window === 'undefined') return false;

    try {
      // Only save if we have meaningful data
      const hasContent = Object.values(data || {}).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return !!value && value !== '0';
      });

      if (!hasContent) {
        console.log('📱 No meaningful content to save as draft');
        return false;
      }

      const draftData = {
        ...data,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };

      localStorage.setItem(key, JSON.stringify(draftData));
      setLastSaved(new Date());
      setHasDraft(true);
      setHasUnsavedChanges(false);
      
      console.log('📱 Draft saved to phone storage:', { 
        key, 
        fields: Object.keys(data).length,
        hasImages: !!data.images?.length 
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save draft to phone storage:', error);
      return false;
    }
  }, [key, data]);

  // Load from localStorage
  const loadDraft = useCallback((): any | null => {
    if (typeof window === 'undefined') return null;

    try {
      const draft = localStorage.getItem(key);
      if (!draft) return null;

      const parsed = JSON.parse(draft);
      console.log('📱 Draft loaded from phone storage:', { 
        key, 
        savedAt: parsed.savedAt,
        fields: Object.keys(parsed).length 
      });
      
      return parsed;
    } catch (error) {
      console.error('❌ Failed to load draft from phone storage:', error);
      return null;
    }
  }, [key]);

  // Delete draft
  const deleteDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(key);
      setHasDraft(false);
      setLastSaved(null);
      setHasUnsavedChanges(false);
      console.log('📱 Draft deleted from phone storage:', key);
    } catch (error) {
      console.error('❌ Failed to delete draft:', error);
    }
  }, [key]);

  // Auto-save with debounce
  useEffect(() => {
    if (!autoSave || !data) return;

    const timeoutId = setTimeout(() => {
      if (data && Object.keys(data).length > 0) {
        saveDraft();
      }
    }, debounceMs);

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    return () => clearTimeout(timeoutId);
  }, [data, autoSave, debounceMs, saveDraft]);

  // Warn before page unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // Try to save before leaving
        saveDraft();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, saveDraft]);

  return {
    saveDraft,
    loadDraft,
    deleteDraft,
    hasDraft,
    lastSaved,
    hasUnsavedChanges
  };
}