import { createClient } from '@/supabase';

export interface UserApprovalStatus {
  isApproved: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  message?: string;
}

export async function checkUserApprovalStatus(userId: string): Promise<UserApprovalStatus> {
  try {
    const supabase = createClient();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return {
        isApproved: false,
        approvalStatus: 'pending',
        message: 'Unable to verify account status. Please contact support.'
      };
    }

    const approvalStatus = profile.approval_status || 'pending';

    switch (approvalStatus) {
      case 'approved':
        return {
          isApproved: true,
          approvalStatus: 'approved'
        };
      case 'rejected':
        return {
          isApproved: false,
          approvalStatus: 'rejected',
          message: 'Your account application has been declined. Please contact support if you believe this is an error.'
        };
      case 'pending':
      default:
        return {
          isApproved: false,
          approvalStatus: 'pending',
          message: 'Your account is awaiting approval (usually within 24 hours). You will receive an email notification once approved.'
        };
    }
  } catch (error) {
    console.error('Error checking user approval status:', error);
    return {
      isApproved: false,
      approvalStatus: 'pending',
      message: 'Unable to verify account status. Please contact support.'
    };
  }
}