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
 * Save property data as a draft (using new draft system)
 */
export async function saveDraft(formData: any, existingDraftId?: string): Promise<DraftSaveResponse> {
  try {
    console.log('🗂️ Saving property draft to new draft system...', {
      hasTitle: !!formData.title,
      hasImages: !!formData.images?.length,
      hasDescription: !!formData.description,
      existingDraftId
    });

    // Extract title for draft identification (fallback to property type + timestamp)
    const draftTitle = formData.title || 
      `${formData.property_type || 'Property'} - ${new Date().toLocaleDateString()}`;

    // Prepare draft data - remove internal flags
    const { status, is_draft, saved_at, _isDraftSave, _isPublishDraft, ...cleanFormData } = formData;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    // Use new draft endpoints
    const endpoint = existingDraftId 
      ? `/api/properties/drafts/${existingDraftId}`
      : '/api/properties/drafts';
    
    const method = existingDraftId ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        draft_id: existingDraftId,
        title: draftTitle,
        draft_type: cleanFormData.listing_type || 'sale',
        ...cleanFormData
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Draft saved successfully to new system:', result.draft_id);
      return {
        success: true,
        draftId: result.draft_id
      };
    } else {
      console.error('❌ Draft save failed:', result.error);
      return {
        success: false,
        error: result.error || 'Failed to save draft'
      };
    }
  } catch (error: any) {
    console.error('❌ Draft save error:', error);
    
    let errorMessage = 'Network error while saving draft';
    if (error.name === 'AbortError') {
      errorMessage = 'Draft save timed out - please try again';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
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
 * Convert draft to full property submission (using new publish endpoint)
 */
export async function publishDraft(draftId: string, formData?: any): Promise<DraftSaveResponse> {
  try {
    console.log('🚀 Publishing draft using new publish endpoint:', draftId);
    
    const response = await fetch(`/api/properties/drafts/${draftId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Draft published successfully:', result.property_id);
      return {
        success: true,
        draftId: result.property_id
      };
    } else {
      console.error('❌ Draft publish failed:', result.error);
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