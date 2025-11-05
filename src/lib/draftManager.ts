// Draft management system for property creation
// Handles saving, loading, and managing property drafts

export interface DraftProperty {
  id?: string;
  user_id: string;
  draft_data: any;
  title?: string;
  last_saved: string;
  created_at: string;
}

export interface DraftSaveResponse {
  success: boolean;
  draftId?: string;
  error?: string;
}

/**
 * Save property data as a draft
 */
export async function saveDraft(formData: any): Promise<DraftSaveResponse> {
  try {
    console.log('🗂️ Saving property draft...', {
      hasTitle: !!formData.title,
      hasImages: !!formData.images?.length,
      hasDescription: !!formData.description
    });

    // Prepare draft data with essential fields
    const draftData = {
      ...formData,
      status: 'draft',
      is_draft: true,
      saved_at: new Date().toISOString()
    };

    // Extract title for draft identification (fallback to property type + timestamp)
    const draftTitle = formData.title || 
      `${formData.property_type || 'Property'} - ${new Date().toLocaleDateString()}`;

    const response = await fetch('/api/properties/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...draftData,
        title: draftTitle,
        _isDraftSave: true // Internal flag to indicate this is a draft save
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Draft saved successfully:', result.propertyId);
      return {
        success: true,
        draftId: result.propertyId
      };
    } else {
      console.error('❌ Draft save failed:', result.error);
      return {
        success: false,
        error: result.error || 'Failed to save draft'
      };
    }
  } catch (error) {
    console.error('❌ Draft save error:', error);
    return {
      success: false,
      error: 'Network error while saving draft'
    };
  }
}

/**
 * Load user's drafts
 */
export async function loadUserDrafts(): Promise<DraftProperty[]> {
  try {
    const response = await fetch('/api/properties/drafts');
    
    if (!response.ok) {
      throw new Error('Failed to load drafts');
    }
    
    const data = await response.json();
    return data.drafts || [];
  } catch (error) {
    console.error('❌ Error loading drafts:', error);
    return [];
  }
}

/**
 * Load a specific draft by ID
 */
export async function loadDraft(draftId: string): Promise<any | null> {
  try {
    const response = await fetch(`/api/properties/drafts/${draftId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load draft');
    }
    
    const data = await response.json();
    return data.draft;
  } catch (error) {
    console.error('❌ Error loading draft:', error);
    return null;
  }
}

/**
 * Delete a draft
 */
export async function deleteDraft(draftId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/properties/drafts/${draftId}`, {
      method: 'DELETE'
    });
    
    return response.ok;
  } catch (error) {
    console.error('❌ Error deleting draft:', error);
    return false;
  }
}

/**
 * Convert draft to full property submission
 */
export async function publishDraft(draftId: string, formData: any): Promise<DraftSaveResponse> {
  try {
    const response = await fetch('/api/properties/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        status: 'pending', // Change from draft to pending for review
        _isPublishDraft: true,
        _draftId: draftId // Include original draft ID for cleanup
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Delete the draft after successful submission
      await deleteDraft(draftId);
      
      return {
        success: true,
        draftId: result.propertyId
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to publish draft'
      };
    }
  } catch (error) {
    console.error('❌ Draft publish error:', error);
    return {
      success: false,
      error: 'Network error while publishing draft'
    };
  }
}

/**
 * Get draft summary for display
 */
export function getDraftSummary(draft: DraftProperty): string {
  const data = draft.draft_data;
  const parts: string[] = [];
  
  if (data.property_type) parts.push(data.property_type);
  if (data.city) parts.push(data.city);
  if (data.price) parts.push(`$${data.price}`);
  if (data.bedrooms) parts.push(`${data.bedrooms}BR`);
  
  return parts.join(' • ') || 'Untitled Draft';
}