import { useState } from 'react';
import { useDuplicateDetection } from './useDuplicateDetection';

interface UsePropertySubmissionProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface UsePropertySubmissionReturn {
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  duplicateDetection: ReturnType<typeof useDuplicateDetection>;
  handleSubmit: (e: React.FormEvent, submissionCallback: () => Promise<void>, bypassDuplicate?: boolean, title?: string) => Promise<void>;
  resetSubmissionState: () => void;
}

export function usePropertySubmission({ 
  onSuccess, 
  onError 
}: UsePropertySubmissionProps): UsePropertySubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const duplicateDetection = useDuplicateDetection();

  const handleSubmit = async (
    e: React.FormEvent,
    submissionCallback: () => Promise<void>,
    bypassDuplicate: boolean = false,
    title?: string
  ) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('🚫 Already submitting, ignoring duplicate click');
      return;
    }
    
    // Clear previous states
    setSubmitError(null);
    duplicateDetection.setShowDuplicateWarning(false);

    // Check for duplicates unless bypassed
    if (!bypassDuplicate && title && title.length > 5) {
      const hasDuplicate = await duplicateDetection.checkForDuplicates(title, true);
      if (hasDuplicate) {
        return; // Stop submission, show warning dialog
      }
    }

    // Start submission process
    setIsSubmitting(true);
    console.log('🚀 Starting property submission...');

    try {
      await submissionCallback();
      
      // Success!
      setSubmitSuccess(true);
      onSuccess();
      setIsSubmitting(false);
      
    } catch (error: any) {
      console.error('❌ Error during property submission:', error);
      const errorMessage = error.message || 'Failed to create property. Please try again.';
      setSubmitError(errorMessage);
      onError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const resetSubmissionState = () => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    duplicateDetection.resetDuplicateState();
  };

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    duplicateDetection,
    handleSubmit,
    resetSubmissionState,
  };
}