"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAdminData, getAdminDisplayName } from '@/hooks/useAdminData';
import UniversalPropertyManager from '@/components/UniversalPropertyManager';
import EngagementOverview from '../components/EngagementOverview';
import EmailBounceAlert from '@/components/EmailBounceAlert';
import VisitorAnalytics from '@/components/VisitorAnalytics';

interface Property {
  id: string;
  title: string;  
  description: string;
  price: number;
pe?: string;
  listing_type?: string;
  property_type?: string;
  bedrooms: number;
  bathrooms: number;
  region: string;
  city: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_email: string;
  owner_whatsapp: string;
  listed_by_type: string;
  user_id: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  property_media: Array<{
    media_url: string;
    is_primary: boolean;
  }>;
  owner: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
  reviewer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Statistics {
  totalPending: number;
  todaySubmissions: number;
  byUserType: {
    fsbo: number;
    agent: number;
    landlord: number;
  };
  totalActive: number;
  totalRejected: number;
  totalDrafts: number;
  totalRentals: number;
  activeRentals: number;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  admin_level?: string;
  created_at: string;
  updated_at: string;
}

interface AgentVetting {
  id: string;
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  selected_plan?: string;
  country: string;
  years_experience?: string;
  company_name?: string;
  license_number?: string;
  license_type?: string;
  specialties?: string;
  target_region?: string;
  reference1_name?: string;
  reference1_phone?: string;
  reference1_email?: string;
  reference2_name?: string;
  reference2_phone?: string;
  reference2_email?: string;
  promo_code?: string;
  promo_benefits?: string;
  promo_spot_number?: number;
  is_founding_member?: boolean;
  user_type: string;
  status: 'pending_review' | 'approved' | 'denied' | 'needs_more_info';
  submitted_at: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface PricingPlan {
  id: string;
  plan_name: string;
}

interface OwnerApplication {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: 'owner' | 'landlord';
  plan: string | null;
  is_founding_member: boolean;
  promo_code: string | null;
  country_id: string | null;
  created_at: string;
}

// Common rejection reasons for FSBO/Landlord applications
const OWNER_REJECTION_REASONS = [
  { value: 'incomplete_info', label: 'Incomplete information' },
  { value: 'invalid_contact', label: 'Invalid contact details' },
  { value: 'suspicious_activity', label: 'Suspicious activity' },
  { value: 'platform_requirements', label: 'Does not meet platform requirements' },
  { value: 'duplicate_account', label: 'Duplicate account' },
  { value: 'invalid_documentation', label: 'Invalid property documentation' },
  { value: 'other', label: 'Other (specify below)' },
];

export default function UnifiedAdminDashboard() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading, error: adminError } = useAdminData();
  
  // State management
  const [activeSection, setActiveSection] = useState<'dashboard' | 'properties' | 'system' | 'users' | 'drafts' | 'agents' | 'fsbo' | 'landlords' | 'emails'>('dashboard');
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [approvedProperties, setApprovedProperties] = useState<Property[]>([]);
  const [draftProperties, setDraftProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingAgents, setPendingAgents] = useState<AgentVetting[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [pendingOwners, setPendingOwners] = useState<OwnerApplication[]>([]);
  const [processingAgentId, setProcessingAgentId] = useState<string | null>(null);
  const [processingOwnerId, setProcessingOwnerId] = useState<string | null>(null);
  const [agentRejectReason, setAgentRejectReason] = useState("");
  const [ownerRejectReason, setOwnerRejectReason] = useState("");
  const [ownerRejectType, setOwnerRejectType] = useState<'permanent' | 'needs_correction'>('needs_correction');
  const [ownerRejectReasonDropdown, setOwnerRejectReasonDropdown] = useState("");
  const [ownerRejectDetails, setOwnerRejectDetails] = useState("");
  const [ownerRejectSendEmail, setOwnerRejectSendEmail] = useState(true);
  const [showAgentRejectModal, setShowAgentRejectModal] = useState<string | null>(null);
  const [showOwnerRejectModal, setShowOwnerRejectModal] = useState<string | null>(null);
  const [expandedAgentReferences, setExpandedAgentReferences] = useState<Set<string>>(new Set());
  const [statistics, setStatistics] = useState<Statistics>({
    totalPending: 0,
    todaySubmissions: 0,
    byUserType: { fsbo: 0, agent: 0, landlord: 0 },
    totalActive: 0,
    totalRejected: 0,
    totalDrafts: 0,
    totalRentals: 0,
    activeRentals: 0,
  });
  const [processingPropertyId, setProcessingPropertyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Wait for Supabase auth to fully initialize before allowing data fetches.
  // During session restoration, onAuthStateChange can fire SIGNED_IN → SIGNED_OUT → SIGNED_IN.
  // We only flip authReady once the initial session check has settled.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        setAuthReady(true);
      }
    });
    // Fallback: if session already exists (e.g. restored from cookie before listener attached)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Authentication & authorization — only load data once auth is ready
  useEffect(() => {
    if (!authReady || adminLoading) return;

    // Only load data if user is an admin
    if (isAdmin) {
      loadDashboardData();
      if (permissions?.canAccessUserManagement) {
        loadUsers();
      }
      loadDrafts();
      loadAgents();
      loadOwnerApplications();
    }
  }, [authReady, adminLoading, isAdmin, permissions]);

  const loadDashboardData = async () => {
    if (!authReady) return;
    try {
      console.log('🔄 Loading dashboard data...');
      
      // Build query with profiles data for pending properties needing review
      // NOTE: 'draft' status properties are personal drafts and should NOT appear here
      let propertiesQuery = supabase
        .from('properties')
        .select(`
          *,
          owner:profiles!user_id (
            id,
            email,
            first_name,
            last_name,
            user_type
          )
        `)
        .eq('status', 'pending');

      // Apply country filter for non-super admins
      if (permissions && !permissions.canViewAllCountries && permissions.countryFilter) {
        propertiesQuery = propertiesQuery.eq('country_id', permissions.countryFilter);
      }

      const { data: properties, error: propertiesError } = await propertiesQuery;

      if (propertiesError) {
        console.error('Properties error:', propertiesError);
        setError('Failed to load properties');
        return;
      }

      setPendingProperties(properties || []);

      // Load approved/active properties
      let approvedQuery = supabase
        .from('properties')
        .select(`
          *,
          owner:profiles!user_id (
            id,
            email,
            first_name,
            last_name,
            user_type
          )
        `)
        .eq('status', 'active');

      // Apply same country filter
      if (permissions && !permissions.canViewAllCountries && permissions.countryFilter) {
        approvedQuery = approvedQuery.eq('country_id', permissions.countryFilter);
      }

      const { data: approvedProps, error: approvedError } = await approvedQuery;

      if (approvedError) {
        console.error('Approved properties error:', approvedError);
      } else {
        setApprovedProperties(approvedProps || []);
      }

      // Load statistics
      const { data: stats, error: statsError } = await supabase
        .from('properties')
        .select('status, created_at, user_id, listed_by_type, listing_type');

      if (statsError) {
        console.error('Stats error:', statsError);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const todaySubmissions = stats?.filter((p: any) => 
        p.created_at.startsWith(today)
      ).length || 0;

      let byUserType = { fsbo: 0, agent: 0, landlord: 0 };
      
      if (stats) {
        stats.forEach((property: any) => {
          // Count all properties regardless of status for byUserType stats
          if (property.listed_by_type === 'owner') byUserType.fsbo++;
          else if (property.listed_by_type === 'agent') byUserType.agent++;
          else if (property.listed_by_type === 'landlord') byUserType.landlord++;
        });
      }

      // Get draft count from the separate property_drafts table
      let totalDrafts = 0;
      try {
        const draftResponse = await fetch(permissions && !permissions.canViewAllCountries && permissions.countryFilter 
          ? `/api/admin/drafts?country=${permissions.countryFilter}`
          : '/api/admin/drafts');
        if (draftResponse.ok) {
          const draftResult = await draftResponse.json();
          totalDrafts = draftResult.drafts?.length || 0;
        }
      } catch (draftError) {
        console.error('Error loading draft count for statistics:', draftError);
      }

      setStatistics({
        totalPending: properties?.length || 0,
        todaySubmissions,
        byUserType,
        totalActive: stats?.filter((p: any) => p.status === 'active').length || 0,
        totalRejected: stats?.filter((p: any) => p.status === 'rejected').length || 0,
        totalDrafts,
        totalRentals: stats?.filter((p: any) => p.listing_type === 'rent').length || 0,
        activeRentals: stats?.filter((p: any) => p.listing_type === 'rent' && p.status === 'active').length || 0,
      });

    } catch (error) {
      console.error('Dashboard load error:', error);
      setError('Failed to load dashboard data');
    }
  };

  const loadUsers = async () => {
    if (!authReady) return;
    if (!permissions?.canAccessUserManagement) return;

    try {
      let usersQuery = supabase
        .from('profiles')
        .select('id, email, first_name, last_name, user_type, admin_level, created_at, updated_at');

      // Apply country filter for non-super admins
      if (!permissions.canViewAllCountries && permissions.countryFilter) {
        usersQuery = usersQuery.eq('country_id', permissions.countryFilter);
      }

      const { data: usersData, error: usersError } = await usersQuery;

      if (usersError) {
        console.error('Users error:', usersError);
        return;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadDrafts = async () => {
    if (!authReady) return;
    try {
      console.log('🔄 Loading draft properties...');

      // Build URL with country filter if needed
      let apiUrl = '/api/admin/drafts';
      if (permissions && !permissions.canViewAllCountries && permissions.countryFilter) {
        apiUrl += `?country=${permissions.countryFilter}`;
      }

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!response.ok) {
        console.error('Drafts API error:', result.error);
        setError(`Failed to load draft properties: ${result.error}`);
        return;
      }

      setDraftProperties(result.drafts || []);
      console.log(`✅ Loaded ${result.drafts?.length || 0} draft properties`);

    } catch (error) {
      console.error('Error loading drafts:', error);
      setError('Failed to load draft properties');
    }
  };

  const loadAgents = async () => {
    if (!authReady) return;
    try {
      console.log('🔄 Loading all agents (pending and approved)...');

      // Fetch pricing plans for plan name lookup
      const { data: plans } = await supabase
        .from('pricing_plans')
        .select('id, plan_name');

      if (plans) {
        setPricingPlans(plans);
      }

      // Get ALL agent applications (not just pending) - this is the source of truth
      let agentsQuery = supabase
        .from('agent_vetting')
        .select('*')
        .in('status', ['pending_review', 'approved', 'denied']); // Include all statuses

      // Apply country filter for non-super admins
      if (permissions && !permissions.canViewAllCountries && permissions.countryFilter) {
        agentsQuery = agentsQuery.eq('country', permissions.countryFilter);
      }

      const { data: agents, error: agentsError } = await agentsQuery;

      if (agentsError) {
        console.warn('⚠️ Agents table not available:', agentsError.message);
        setPendingAgents([]);
        return;
      }

      if (!agents || agents.length === 0) {
        setPendingAgents([]);
        console.log('✅ No agents found in system');
        return;
      }

      // Get profile data for each agent manually
      const enrichedAgents = await Promise.all(
        agents.map(async (agent: AgentVetting) => {
          // Pre-registration agents have no user_id yet — skip profile lookup
          if (!agent.user_id) {
            return {
              ...agent,
              profiles: null,
              effective_user_type: 'agent'
            };
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name, user_type')
            .eq('id', agent.user_id)
            .single();

          return {
            ...agent,
            profiles: profile || null,
            // Override profile user_type with agent_vetting source of truth
            effective_user_type: 'agent' // Since they're in agent_vetting table
          };
        })
      );

      // Separate pending from approved/denied for display
      const pendingAgents = enrichedAgents.filter(agent => agent.status === 'pending_review');
      const approvedAgents = enrichedAgents.filter(agent => agent.status === 'approved');
      const deniedAgents = enrichedAgents.filter(agent => agent.status === 'denied');

      setPendingAgents(pendingAgents);
      
      console.log(`✅ Loaded agents: ${pendingAgents.length} pending, ${approvedAgents.length} approved, ${deniedAgents.length} denied`);
      console.log('📋 All agents:', enrichedAgents.map(a => `${a.profiles?.first_name} ${a.profiles?.last_name} (${a.status})`));

    } catch (error) {
      console.warn('⚠️ Error loading agents (non-critical):', error);
      setPendingAgents([]);
    }
  };

  const loadOwnerApplications = async () => {
    if (!authReady) return;
    try {
      console.log('🔄 Loading pending FSBO/Landlord applications...');

      // Call the RPC function that joins profiles with auth.users
      const { data: applications, error: rpcError } = await supabase
        .rpc('get_pending_owner_applications');

      if (rpcError) {
        console.warn('⚠️ Owner applications RPC not available:', rpcError.message);
        setPendingOwners([]);
        return;
      }

      // Apply country filter for non-super admins
      let filtered = applications || [];
      if (permissions && !permissions.canViewAllCountries && permissions.countryFilter) {
        filtered = filtered.filter((app: OwnerApplication) =>
          app.country_id === permissions.countryFilter || !app.country_id
        );
      }

      // Validate that all applications have valid IDs
      const validApplications = filtered.filter((app: OwnerApplication) => {
        if (!app.id) {
          console.warn('⚠️ Found application with null/undefined ID:', app);
          return false;
        }
        return true;
      });

      if (validApplications.length !== filtered.length) {
        console.warn(`⚠️ Filtered out ${filtered.length - validApplications.length} applications with invalid IDs`);
      }

      setPendingOwners(validApplications);
      console.log(`✅ Loaded ${validApplications.length} pending owner applications`, validApplications);

    } catch (error) {
      console.warn('⚠️ Error loading owner applications (non-critical):', error);
      setPendingOwners([]);
    }
  };

  // Helper function to resolve plan display name from UUID or string
  const getPlanDisplayName = (selectedPlan: string | null | undefined): string => {
    if (!selectedPlan) return 'Not selected';

    // Check if it's a UUID (e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(selectedPlan)) {
      // Look up plan name from pricing_plans
      const plan = pricingPlans.find(p => p.id === selectedPlan);
      return plan?.plan_name || selectedPlan; // Fallback to UUID if not found
    }

    // It's a string identifier (e.g., "founding_member") - format it nicely
    return selectedPlan.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const approveProperty = async (propertyId: string) => {
    setProcessingPropertyId(propertyId);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`/api/properties/update/${propertyId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: 'active' }),
      });

      const result = await response.json();

      if (response.ok) {
        const property = pendingProperties.find(p => p.id === propertyId);
        alert(`✅ Property "${property?.title}" has been approved and is now active!`);
        await loadDashboardData();
      } else {
        setError(result.error || 'Failed to approve property');
      }
    } catch (error) {
      console.error('❌ Network error during approval:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingPropertyId(null);
  };

  const rejectProperty = async (propertyId: string, reason: string) => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setProcessingPropertyId(propertyId);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`/api/properties/update/${propertyId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: 'rejected', rejection_reason: reason }),
      });

      const result = await response.json();

      if (response.ok) {
        const property = pendingProperties.find(p => p.id === propertyId);
        alert(`❌ Property "${property?.title}" has been rejected.\nReason: ${reason}`);
        setShowRejectModal(null);
        setRejectReason("");
        await loadDashboardData();
      } else {
        setError(result.error || 'Failed to reject property');
      }
    } catch (error) {
      console.error('❌ Network error during rejection:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingPropertyId(null);
  };

  const approveAgent = async (agentId: string) => {
    setProcessingAgentId(agentId);
    setError('');
    
    try {
      const agent = pendingAgents.find(a => a.id === agentId);
      const agentName = agent ? 
        `${agent.first_name} ${agent.last_name}`.trim() || agent.email :
        'Agent';
      
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      // Call the new approval API endpoint
      const response = await fetch('/api/admin/agents/approve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ agentId })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to approve agent');
        return;
      }

      console.log('✅ Agent approved successfully:', result);
      
      // Send approval email notification
      try {
        await fetch('/api/send-agent-approval-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentEmail: result.email,
            agentName: result.name,
            country: agent?.country || 'GY'
          })
        });
        console.log('✅ Agent approval email sent successfully');
      } catch (emailError) {
        console.warn('⚠️ Failed to send approval email:', emailError);
      }

      alert(`✅ Agent "${agentName}" has been approved! They can log in with their registration email and password.`);
      await loadAgents();
      
    } catch (error) {
      console.error('❌ Network error during agent approval:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingAgentId(null);
  };

  const rejectAgent = async (agentId: string, reason: string) => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setProcessingAgentId(agentId);
    setError('');
    
    try {
      const { error: updateError } = await supabase
        .from('agent_vetting')
        .update({ 
          status: 'denied', 
          denied_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', agentId);

      if (updateError) {
        setError(updateError.message || 'Failed to reject agent');
        return;
      }

      const agent = pendingAgents.find(a => a.id === agentId);
      const agentName = agent?.profiles ?
        `${agent.profiles.first_name} ${agent.profiles.last_name}`.trim() || agent.profiles.email :
        'Agent';

      // Send rejection email notification
      if (agent) {
        try {
          await fetch('/api/send-agent-rejection-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentEmail: agent.profiles?.email || agent.email,
              agentName: agentName,
              rejectionReason: reason,
              country: agent.country || 'GY'
            })
          });
          console.log('✅ Agent rejection email sent successfully');
        } catch (emailError) {
          console.warn('⚠️ Failed to send rejection email:', emailError);
        }
      }

      alert(`❌ Agent "${agentName}" has been rejected and notified via email.\nReason: ${reason}`);
      setShowAgentRejectModal(null);
      setAgentRejectReason("");
      await loadAgents();
      
    } catch (error) {
      console.error('❌ Network error during agent rejection:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingAgentId(null);
  };

  const approveOwnerApplication = async (userId: string) => {
    // Validate userId before proceeding
    if (!userId) {
      console.error('❌ approveOwnerApplication called with null/undefined userId');
      setError('Invalid application ID. Please refresh and try again.');
      return;
    }

    setProcessingOwnerId(userId);
    setError('');

    try {
      const application = pendingOwners.find(a => a.id === userId);
      console.log('📋 Approving owner application:', { userId, application });
      const ownerName = application ?
        `${application.first_name || ''} ${application.last_name || ''}`.trim() || application.email :
        'User';
      const userTypeLabel = application?.user_type === 'landlord' ? 'Landlord' : 'FSBO';

      // Update the profiles table with approval and sync missing data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approval_date: new Date().toISOString(),
          approved_by: adminData?.id,
          // Sync data from auth.users metadata
          first_name: application?.first_name || null,
          last_name: application?.last_name || null,
          email: application?.email || null,
          phone: application?.phone || null,
          country_id: application?.country_id || 'GY',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error approving owner:', updateError);
        console.error('Error details:', { code: updateError.code, message: updateError.message, hint: updateError.hint });
        setError(`Failed to approve: ${updateError.message || 'Unknown error'}`);
        setProcessingOwnerId(null);
        return;
      }

      console.log(`✅ ${userTypeLabel} "${ownerName}" approved successfully`);

      // Send approval email
      try {
        const emailResponse = await fetch('/api/send-owner-approval-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: application?.email,
            firstName: application?.first_name || 'User',
            userType: application?.user_type,
            isFoundingMember: application?.is_founding_member || false,
            countryId: application?.country_id || 'GY'
          })
        });

        if (emailResponse.ok) {
          console.log('✅ Approval email sent successfully');
        } else {
          console.warn('⚠️ Failed to send approval email:', await emailResponse.text());
        }
      } catch (emailError) {
        console.warn('⚠️ Failed to send approval email:', emailError);
        // Don't fail the approval if email fails
      }

      alert(`✅ ${userTypeLabel} "${ownerName}" has been approved!\n\nThey can now log in and list properties.`);
      await loadOwnerApplications();

    } catch (error) {
      console.error('❌ Error approving owner application:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingOwnerId(null);
  };

  const rejectOwnerApplication = async (
    userId: string,
    rejectionType: 'permanent' | 'needs_correction',
    reasonDropdown: string,
    additionalDetails: string,
    sendEmail: boolean
  ) => {
    // Validate userId before proceeding
    if (!userId) {
      console.error('❌ rejectOwnerApplication called with null/undefined userId');
      setError('Invalid application ID. Please refresh and try again.');
      return;
    }

    if (!reasonDropdown) {
      setError('Please select a reason for rejection');
      return;
    }

    setProcessingOwnerId(userId);
    setError('');

    try {
      const application = pendingOwners.find(a => a.id === userId);
      console.log('📋 Rejecting owner application:', { userId, rejectionType, reasonDropdown, additionalDetails, application });
      const ownerName = application ?
        `${application.first_name || ''} ${application.last_name || ''}`.trim() || application.email :
        'User';
      const userTypeLabel = application?.user_type === 'landlord' ? 'Landlord' : 'FSBO';

      // Build full rejection reason
      const reasonLabel = OWNER_REJECTION_REASONS.find(r => r.value === reasonDropdown)?.label || reasonDropdown;
      const fullReason = additionalDetails.trim()
        ? `${reasonLabel}: ${additionalDetails.trim()}`
        : reasonLabel;

      // Determine approval_status based on rejection type
      const approvalStatus = rejectionType === 'permanent' ? 'rejected' : 'needs_correction';

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          approval_status: approvalStatus,
          rejection_reason: fullReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error rejecting owner:', updateError);
        setError(updateError.message || 'Failed to reject application');
        return;
      }

      console.log(`✅ ${userTypeLabel} "${ownerName}" ${rejectionType === 'permanent' ? 'rejected' : 'marked as needs correction'}`);

      // Send rejection/correction email if checkbox is checked
      if (sendEmail && application?.email) {
        try {
          const emailResponse = await fetch('/api/send-owner-rejection-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: application.email,
              firstName: application.first_name || 'User',
              userType: application.user_type,
              rejectionType,
              reason: fullReason,
              countryId: application.country_id || 'GY'
            })
          });

          if (emailResponse.ok) {
            console.log(`✅ ${rejectionType === 'permanent' ? 'Rejection' : 'Correction'} email sent successfully`);
          } else {
            console.warn('⚠️ Failed to send rejection email:', await emailResponse.text());
          }
        } catch (emailError) {
          console.warn('⚠️ Failed to send rejection email:', emailError);
          // Don't fail the rejection if email fails
        }
      }

      const actionText = rejectionType === 'permanent' ? 'rejected' : 'marked as needing corrections';
      alert(`${rejectionType === 'permanent' ? '❌' : '⚠️'} ${userTypeLabel} "${ownerName}" has been ${actionText}.\nReason: ${fullReason}${sendEmail ? '\n\nNotification email sent.' : ''}`);

      // Reset modal state
      setShowOwnerRejectModal(null);
      setOwnerRejectReason("");
      setOwnerRejectType('needs_correction');
      setOwnerRejectReasonDropdown("");
      setOwnerRejectDetails("");
      setOwnerRejectSendEmail(true);

      await loadOwnerApplications();

    } catch (error) {
      console.error('❌ Error rejecting owner application:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingOwnerId(null);
  };

  // Mark an agent as manually approved (for cases where profile was created directly)
  const markAsManuallyApproved = async (agentId: string) => {
    setProcessingAgentId(agentId);
    setError('');

    const agent = pendingAgents.find(a => a.id === agentId);
    const agentName = agent?.first_name && agent?.last_name
      ? `${agent.first_name} ${agent.last_name}`.trim()
      : agent?.email || 'Agent';

    if (!confirm(`Mark "${agentName}" as manually approved?\n\nUse this when the agent's profile was already created directly in the database.`)) {
      setProcessingAgentId(null);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        setProcessingAgentId(null);
        return;
      }

      const response = await fetch('/api/admin/agents/mark-approved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ agentId })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to mark agent as approved');
        return;
      }

      console.log('✅ Agent marked as manually approved:', result);
      alert(`✅ Agent "${agentName}" has been marked as manually approved and removed from the pending queue.`);
      await loadAgents();

    } catch (error) {
      console.error('❌ Network error:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingAgentId(null);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshSuccess(false);
    try {
      await Promise.all([
        loadDashboardData(),
        loadDrafts(),
        loadAgents(),
        loadOwnerApplications(),
        ...(permissions?.canAccessUserManagement ? [loadUsers()] : []),
      ]);
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/admin-login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/admin-login');
    }
  };

  const getEditUrl = (property: Property) => {
    const baseUrl = `/admin-dashboard/property/${property.id}`;
    return baseUrl;
  };

  const displayUserType = (dbValue: string) => {
    const map: { [key: string]: string } = {
      'owner': 'FSBO',
      'agent': 'Agent', 
      'landlord': 'Landlord'
    };
    return map[dbValue] || dbValue;
  };

  // Mobile Property Card Component
  const MobilePropertyCard = ({ property }: { property: Property }) => {
    const primaryImage = property.property_media?.find(media => media.is_primary);
    
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
        {/* Property Image */}
        <div className="relative h-48 bg-gray-200">
          {primaryImage ? (
            <img 
              src={primaryImage.media_url} 
              alt={property.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center">
                <div className="text-4xl mb-2">🏠</div>
                <p className="text-gray-500 text-sm">No Image</p>
              </div>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
              ⏳ PENDING REVIEW
            </span>
          </div>
        </div>

        {/* Property Details */}
        <div className="p-4">
          {/* Title & Price */}
          <div className="mb-3">
            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
              {property.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-green-600">
                ${property.price?.toLocaleString() || 'N/A'}
              </span>
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {displayUserType(property.listed_by_type)}
              </span>
            </div>
          </div>

          {/* Property Info */}
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs font-medium text-blue-800">🛏️ Beds</div>
              <div className="text-sm font-bold text-blue-900">{property.bedrooms || 'N/A'}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs font-medium text-blue-800">🚿 Baths</div>
              <div className="text-sm font-bold text-blue-900">{property.bathrooms || 'N/A'}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs font-medium text-blue-800">🏠 Type</div>
              <div className="text-xs font-bold text-blue-900">{property.property_type || 'N/A'}</div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-800 mb-1">📍 Location</h4>
            <p className="text-sm text-gray-600">
              {property.city}, {property.region}
            </p>
          </div>
          
          {/* Description */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-800 mb-1">📝 Description</h4>
            <p className="text-sm text-gray-600 line-clamp-3">
              {property.description}
            </p>
          </div>

          {/* Owner Info Card */}
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <div className="text-xs font-medium text-green-800 mb-1">Property Owner</div>
            <div className="text-sm text-green-700">
              <div className="flex items-center justify-between">
                <span className="truncate">📧 {property.owner_email}</span>
                {property.owner_whatsapp && (
                  <span className="ml-2">📱 {property.owner_whatsapp}</span>
                )}
              </div>
              <div className="mt-1 text-xs text-green-600">
                Listed {new Date(property.created_at).toLocaleDateString()} by {
                  property.owner ?
                    [property.owner.first_name, property.owner.last_name].filter(Boolean).join(' ') || 'Unknown User'
                    : 'Unknown User'
                }
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => approveProperty(property.id)}
                disabled={processingPropertyId === property.id}
                className="w-full px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processingPropertyId === property.id ? '⏳' : '✅'} Approve
              </button>
              <button
                onClick={() => setShowRejectModal(property.id)}
                disabled={processingPropertyId === property.id}
                className="w-full px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                ❌ Reject
              </button>
            </div>
            
            <Link href={getEditUrl(property)} className="block">
              <button className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
                ✏️ Edit Property
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Navigation Component
  const NavigationTabs = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-1 overflow-x-auto py-2">
          {/* Dashboard (Blue) */}
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            📊 Dashboard
          </button>

          {/* Properties (Green) */}
          <button
            onClick={() => setActiveSection('properties')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === 'properties'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            🏠 Properties
          </button>

          {/* Drafts (Orange) */}
          <button
            onClick={() => setActiveSection('drafts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === 'drafts'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
            }`}
          >
            📝 Drafts
          </button>

          {/* Agents (Purple) */}
          <button
            onClick={() => setActiveSection('agents')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeSection === 'agents'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
            }`}
          >
            👤 Agents
            {pendingAgents.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingAgents.length}
              </span>
            )}
          </button>

          {/* FSBO (Rose) */}
          <button
            onClick={() => setActiveSection('fsbo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeSection === 'fsbo'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
            }`}
          >
            🏠 FSBO
            {pendingOwners.filter(o => o.user_type === 'owner').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingOwners.filter(o => o.user_type === 'owner').length}
              </span>
            )}
          </button>

          {/* Landlords (Teal) */}
          <button
            onClick={() => setActiveSection('landlords')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeSection === 'landlords'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
            }`}
          >
            🏢 Landlords
            {pendingOwners.filter(o => o.user_type === 'landlord').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingOwners.filter(o => o.user_type === 'landlord').length}
              </span>
            )}
          </button>

          {/* PRIORITY 4: User Management - Administrative Tasks */}
          {permissions?.canAccessUserManagement && (
            <button
              onClick={() => setActiveSection('users')}
              className={`hidden px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === 'users'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              � Users
            </button>
          )}

          {/* PRIORITY 5: System Settings - Advanced/Less Frequent (Super Admin Only) */}
          {permissions?.canAccessSystemSettings && (
            <button
              onClick={() => setActiveSection('system')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === 'system'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🛠️ System
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Access Denied - Show clean message instead of error popup + redirect
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to view this page. Admin privileges are required to access the admin dashboard.
          </p>
          <div className="space-y-3">
            <Link
              href="/admin-login"
              className="block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Login
            </Link>
            <Link
              href="/"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎯 Unified Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                All-in-one admin control center • {getAdminDisplayName(adminData)} • {permissions?.displayRole || 'Admin'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-3 py-2 border text-sm font-medium rounded-lg transition-colors ${
                  isRefreshing
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    : refreshSuccess
                    ? 'border-green-300 text-green-700 bg-green-50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isRefreshing ? (
                  <><span className="inline-block animate-spin">🔄</span> Refreshing...</>
                ) : refreshSuccess ? (
                  '✓ Updated'
                ) : (
                  '🔄 Refresh'
                )}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <NavigationTabs />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
                <div className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Pending</div>
                <div className="text-3xl font-black text-yellow-900 mb-1">{statistics.totalPending}</div>
                <div className="text-xs text-yellow-700">Need Review</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
                <div className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Today</div>
                <div className="text-3xl font-black text-blue-900 mb-1">{statistics.todaySubmissions}</div>
                <div className="text-xs text-blue-700">New Submissions</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">Active</div>
                <div className="text-3xl font-black text-green-900 mb-1">{statistics.totalActive}</div>
                <div className="text-xs text-green-700">Live Properties</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
                <div className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-1">FSBO</div>
                <div className="text-3xl font-black text-purple-900 mb-1">{statistics.byUserType.fsbo}</div>
                <div className="text-xs text-purple-700">Owner Sales</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
                <div className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">ACTIVE RENTALS</div>
                <div className="text-3xl font-black text-blue-900 mb-1">{statistics.activeRentals}</div>
                <div className="text-xs text-blue-700">Currently listed for rent</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 border border-red-200">
                <div className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">Rejected</div>
                <div className="text-3xl font-black text-red-900 mb-1">{statistics.totalRejected}</div>
                <div className="text-xs text-red-700">Need Fixes</div>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200">
                <div className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1">Drafts</div>
                <div className="text-3xl font-black text-indigo-900 mb-1">{statistics.totalDrafts}</div>
                <div className="text-xs text-indigo-700">Incomplete</div>
              </div>
            </div>

            {/* Email Status Alert */}
            <EmailBounceAlert />

            {/* Dashboard Overview - Quick Access to All Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Property Review & Approvals - Professional Workflow */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-yellow-900">🎯 Property Review & Management</h3>
                  <div className="text-2xl font-black text-yellow-600">{statistics.totalPending}</div>
                </div>
                <ul className="text-xs text-yellow-800 mb-4 space-y-0.5 leading-tight">
                  <li>• Review &amp; approve new listings</li>
                  <li>• Edit property details &amp; pricing</li>
                  <li>• Mark sold / under contract</li>
                  <li>• View property reports</li>
                </ul>
                
                {pendingProperties.length === 0 ? (
                  <div className="text-center py-4 text-yellow-700">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="font-medium">All caught up!</p>
                    <p className="text-xs">No properties awaiting review</p>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    <div className="bg-white rounded-lg p-3 border border-yellow-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">⏳ Requires Review:</h4>
                      <div className="space-y-1">
                        {pendingProperties.slice(0, 3).map((property) => (
                          <div key={property.id} className="flex items-center justify-between text-xs">
                            <span className="truncate flex-1 pr-2">{property.title}</span>
                            <span className="text-gray-600 font-medium">${property.price?.toLocaleString()}</span>
                          </div>
                        ))}
                        {pendingProperties.length > 3 && (
                          <div className="text-gray-500 text-xs pt-1 border-t">
                            + {pendingProperties.length - 3} more awaiting review
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <Link href="/admin-dashboard/property-review">
                  <button className="w-full px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors">
                    Manage Properties →
                  </button>
                </Link>
              </div>

              {/* Complete Property Management */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-orange-900">🏠 All Properties</h3>
                  <div className="text-2xl font-black text-orange-600">{statistics.totalActive + statistics.totalPending}</div>
                </div>
                <p className="text-sm text-orange-800 mb-4">View and manage all properties in the system</p>
                <button
                  onClick={() => setActiveSection('properties')}
                  className="w-full px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Manage All Properties →
                </button>
              </div>

              {/* Draft Properties Management */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-purple-900">📝 Draft Properties</h3>
                  <div className="text-2xl font-black text-purple-600">{statistics.totalDrafts}</div>
                </div>
                <p className="text-sm text-purple-800 mb-4">Manage incomplete property drafts saved by users</p>
                <button
                  onClick={() => setActiveSection('drafts')}
                  className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Manage Draft Properties →
                </button>
              </div>

              {/* Admin Creation - Owner/Super Admin Only */}
              {permissions?.canAccessUserManagement && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-blue-900">👥 Admin Management</h3>
                    <div className="text-2xl font-black text-blue-600">+</div>
                  </div>
                  <p className="text-sm text-blue-800 mb-4">Create and manage admin accounts</p>
                  <Link href="/admin-dashboard/user-management">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      Admin Management →
                    </button>
                  </Link>
                </div>
              )}

              {/* Agent Management - Owner/Super Admin Only */}
              {(adminData?.admin_level === 'super' || adminData?.admin_level === 'owner') && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-emerald-900">👥 Agent Management</h3>
                    <div className="text-2xl">🛡️</div>
                  </div>
                  <p className="text-sm text-emerald-800 mb-4">
                    Verify agents and manage premium rotation
                  </p>
                  <Link href="/admin-dashboard/agents">
                    <button className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                      Manage Agents →
                    </button>
                  </Link>
                </div>
              )}

              {/* User & Suspension Management - Available to All Admin Levels */}
              {permissions?.canViewUsers && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-orange-900">🚫 User & Payment Management</h3>
                    <div className="text-2xl font-black text-orange-600">{users.length}</div>
                  </div>
                  <p className="text-sm text-orange-800 mb-4">
                    View, suspend & manage user accounts for payment enforcement
                  </p>
                  <Link href="/admin-dashboard/users">
                    <button className="w-full px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors">
                      Manage Users & Suspensions →
                    </button>
                  </Link>
                </div>
              )}

              {/* Pricing Management Quick Access */}
              {permissions?.canAccessPricingManagement && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-green-900">💰 Pricing Control</h3>
                    <div className="text-xl text-green-600">$</div>
                  </div>
                  <p className="text-sm text-green-800 mb-4">
                    {permissions.canViewAllCountries 
                      ? 'Manage pricing for all countries and user types'
                      : `Manage pricing for ${permissions.countryFilter}`}
                  </p>
                  <Link href="/admin-dashboard/pricing">
                    <button className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                      Manage Pricing →
                    </button>
                  </Link>
                </div>
              )}

              {/* System Settings for Super Admin */}
              {permissions?.canAccessSystemSettings && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-red-900">🔧 System Settings</h3>
                    <div className="text-xl text-red-600">⚡</div>
                  </div>
                  <p className="text-sm text-red-800 mb-4">Global system configuration and advanced settings</p>
                  <button
                    onClick={() => setActiveSection('system')}
                    className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    System Config →
                  </button>
                </div>
              )}

              {/* Active Properties Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">✅ Live Properties</h3>
                  <div className="text-2xl font-black text-green-600">{statistics.totalActive}</div>
                </div>
                <p className="text-sm text-gray-800 mb-4">Properties currently live on the platform</p>
                <button
                  onClick={() => setActiveSection('properties')}
                  className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View All Properties →
                </button>
              </div>
            </div>

            {/* Visitor Analytics - Bottom of dashboard for reference */}
            <VisitorAnalytics />
          </div>
        )}

        {/* Properties Section */}
        {activeSection === 'properties' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏠 Complete Property Management</h2>
            {adminData && (
              <UniversalPropertyManager
                userId={adminData.id}
                userType="admin"
                editPropertyPath="/admin-dashboard/property"
                createPropertyPath="/properties/create"
                authReady={authReady}
                activeSection={activeSection}
              />
            )}
          </div>
        )}

        {/* Drafts Section */}
        {activeSection === 'drafts' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">📝 Draft Properties Management</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-red-500 mr-2">❌</div>
                  <div className="text-red-800 font-medium">Error</div>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">📊 Draft Statistics</h3>
                  <p className="text-sm text-gray-600">Overview of all property drafts in the system</p>
                </div>
                <button
                  onClick={loadDrafts}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🔄 Refresh Drafts
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-1">Total Drafts</div>
                  <div className="text-2xl font-black text-purple-900">{draftProperties.length}</div>
                  <div className="text-xs text-purple-700">Incomplete Properties</div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Recent Activity</div>
                  <div className="text-2xl font-black text-blue-900">
                    {draftProperties.filter(draft => {
                      const updatedAt = new Date(draft.updated_at);
                      const today = new Date();
                      const diffTime = Math.abs(today.getTime() - updatedAt.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 7;
                    }).length}
                  </div>
                  <div className="text-xs text-blue-700">Updated This Week</div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">User Types</div>
                  <div className="text-2xl font-black text-green-900">
                    {new Set(draftProperties.map(draft => draft.owner?.user_type).filter(Boolean)).size}
                  </div>
                  <div className="text-xs text-green-700">Different User Types</div>
                </div>
              </div>
            </div>

            {/* Draft Properties Grid */}
            {draftProperties.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Draft Properties</h3>
                <p className="text-gray-600">There are currently no draft properties in the system.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {draftProperties.map((draft) => (
                  <div key={draft.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                    {/* Draft Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border-b border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                          📝 DRAFT
                        </span>
                        <span className="text-xs text-purple-700">
                          ID: {draft.id.slice(0, 8)}...
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                        {draft.draft_data?.title || 'Untitled Draft'}
                      </h3>
                    </div>

                    {/* Draft Content */}
                    <div className="p-4">
                      {/* Property Info */}
                      <div className="grid grid-cols-3 gap-3 text-center mb-4">
                        <div className="bg-purple-50 rounded-lg p-2">
                          <div className="text-xs font-medium text-purple-800">🛏️ Beds</div>
                          <div className="text-sm font-bold text-purple-900">{draft.draft_data?.bedrooms || 'N/A'}</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <div className="text-xs font-medium text-purple-800">🚿 Baths</div>
                          <div className="text-sm font-bold text-purple-900">{draft.draft_data?.bathrooms || 'N/A'}</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <div className="text-xs font-medium text-purple-800">💰 Price</div>
                          <div className="text-xs font-bold text-purple-900">
                            {draft.draft_data?.price ? `$${draft.draft_data.price.toLocaleString()}` : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      {(draft.draft_data?.city || draft.draft_data?.region) && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-800 mb-1">📍 Location</h4>
                          <p className="text-sm text-gray-600">
                            {[draft.draft_data?.city, draft.draft_data?.region].filter(Boolean).join(', ') || 'Not specified'}
                          </p>
                        </div>
                      )}

                      {/* Owner Info */}
                      <div className="bg-purple-50 rounded-lg p-3 mb-4">
                        <div className="text-xs font-medium text-purple-800 mb-1">Draft Owner</div>
                        <div className="text-sm text-purple-700">
                          <div className="flex items-center justify-between">
                            <span className="truncate">
                              📧 {draft.owner?.email || 'Unknown'}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-purple-600">
                            {draft.owner ?
                              `${draft.owner.first_name || ''} ${draft.owner.last_name || ''}`.trim() || 'Unknown User'
                              : 'Unknown User'
                            } • {draft.owner?.user_type || 'Unknown'}
                          </div>
                          <div className="text-xs text-purple-500 mt-1">
                            Updated: {new Date(draft.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
                              return;
                            }

                            try {
                              const response = await fetch('/api/admin/drafts', {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ draftId: draft.id }),
                              });

                              const result = await response.json();

                              if (!response.ok) {
                                console.error('Error deleting draft:', result.error);
                                alert(`Failed to delete draft: ${result.error}`);
                                return;
                              }

                              // Refresh drafts and statistics
                              loadDrafts();
                              loadDashboardData();
                              alert('Draft deleted successfully');
                            } catch (error) {
                              console.error('Error deleting draft:', error);
                              alert('Failed to delete draft');
                            }
                          }}
                          className="w-full px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete Draft
                        </button>

                        <button
                          onClick={() => {
                            // Always use agent create-property page for draft editing
                            // It's the only page that has draft loading functionality
                            const editRoute = '/dashboard/agent/create-property';

                            // Navigate with draft ID so form can load the draft
                            window.location.href = `${editRoute}?draft=${draft.id}`;
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Continue Editing
                        </button>

                        <button
                          onClick={async () => {
                            // Check if draft is complete enough for publishing
                            const draftData = draft.draft_data;

                            // DEBUG: Log draft data to see what's actually there
                            console.log('🔍 Draft validation - checking data:', {
                              draftId: draft.id,
                              title: draftData.title,
                              draftTitle: draft.title,
                              hasTitle: !!draftData.title,
                              titleLength: draftData.title?.length,
                              keys: Object.keys(draftData)
                            });

                            // Comprehensive validation with proper field names and user-friendly messages
                            // Location validation: check for location field OR city/region (different forms use different patterns)
                            const hasLocation = () => {
                              return (draftData.location && draftData.location.trim().length > 0) ||
                                     (draftData.city && draftData.city.trim().length > 0) ||
                                     (draftData.region && draftData.region.trim().length > 0);
                            };

                            // Title validation: check draft_data.title OR fall back to draft.title if available
                            const hasTitle = () => {
                              return (draftData.title && draftData.title.trim().length > 0) ||
                                     (draft.title && draft.title.trim().length > 0 && !draft.title.includes('Untitled'));
                            };

                            // Only validate ACTUAL required fields (match the form's required fields)
                            const validationChecks = [
                              { field: 'title', message: 'property title', check: hasTitle },
                              { field: 'price', message: 'price', check: () => draftData.price && parseFloat(draftData.price) > 0 },
                              { field: 'property_type', message: 'property type', check: () => draftData.property_type && draftData.property_type.trim().length > 0 },
                              { field: 'listing_type', message: 'listing type (sale/rental)', check: () => draftData.listing_type && draftData.listing_type.trim().length > 0 },
                              { field: 'description', message: 'description', check: () => draftData.description && draftData.description.trim().length > 0 },
                              { field: 'owner_whatsapp', message: 'WhatsApp contact', check: () => draftData.owner_whatsapp && draftData.owner_whatsapp.trim().length > 0 }
                            ];
                            // Note: Removed bedrooms, bathrooms, location - they are NOT required in the form

                            const missingFields = validationChecks
                              .filter(check => !check.check())
                              .map(check => check.message);

                            if (missingFields.length > 0) {
                              alert(`❌ Cannot publish incomplete draft!\n\nMissing required information:\n• ${missingFields.join('\n• ')}\n\nThe user needs to complete their draft first.`);
                              return;
                            }

                            if (confirm('Submit this draft for approval on behalf of the user? This will move it to the property approval queue.')) {
                              try {
                                const response = await fetch(`/api/properties/drafts/${draft.id}/publish`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                });

                                const result = await response.json();

                                if (!response.ok) {
                                  console.error('Error submitting draft:', result.error);
                                  alert(`Failed to submit draft: ${result.error}`);
                                  return;
                                }

                                // Refresh drafts and statistics
                                loadDrafts();
                                loadDashboardData();
                                alert('Draft submitted for approval successfully');
                              } catch (error) {
                                console.error('Error submitting draft:', error);
                                alert('Failed to submit draft');
                              }
                            }
                          }}
                          className="w-full px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✅ Publish Draft
                        </button>


                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agents Section */}
        {activeSection === 'agents' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">👤 Agent Vetting & Approval</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-red-500 mr-2">❌</div>
                  <div className="text-red-800 font-medium">Error</div>
                </div>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">📊 Agent Applications Overview</h3>
                  <p className="text-sm text-gray-600">Pending agent applications awaiting your review</p>
                </div>
                <button
                  onClick={loadAgents}
                  className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  🔄 Refresh Applications
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-1">Pending Applications</div>
                  <div className="text-2xl font-black text-orange-900">{pendingAgents.length}</div>
                  <div className="text-xs text-orange-700">Awaiting Review</div>
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Countries</div>
                  <div className="text-2xl font-black text-blue-900">
                    {new Set(pendingAgents.map(agent => agent.country).filter(Boolean)).size}
                  </div>
                  <div className="text-xs text-blue-700">Different Countries</div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">Your Authority</div>
                  <div className="text-2xl font-black text-green-900">
                    {permissions?.canViewAllCountries ? 'ALL' : (permissions?.countryFilter || 'Limited')}
                  </div>
                  <div className="text-xs text-green-700">Review Access</div>
                </div>
              </div>
            </div>

            {/* Agent Applications Grid */}
            {pendingAgents.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Agent Applications</h3>
                <p className="text-gray-600">There are currently no agent applications awaiting review.</p>
                {!permissions?.canViewAllCountries && permissions?.countryFilter && (
                  <p className="text-sm text-gray-500 mt-2">
                    You can only see applications for: {permissions.countryFilter}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingAgents.map((agent) => (
                  <div key={agent.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                    {/* Agent Header */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 border-b border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                          👤 AGENT APPLICATION
                        </span>
                        <span className="text-xs text-orange-700">
                          {agent.country}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {/* Use direct agent_vetting fields first, then profiles as fallback */}
                        {`${agent.first_name || agent.profiles?.first_name || ''} ${agent.last_name || agent.profiles?.last_name || ''}`.trim() ||
                          agent.email || agent.profiles?.email || 'Unknown Applicant'}
                      </h3>
                      <p className="text-sm text-gray-600">{agent.email || agent.profiles?.email || 'No email'}</p>
                    </div>

                    {/* Agent Details */}
                    <div className="p-4">
                      {/* Professional Info */}
                      <div className="grid grid-cols-2 gap-3 text-center mb-4">
                        <div className="bg-orange-50 rounded-lg p-2">
                          <div className="text-xs font-medium text-orange-800">💼 Experience</div>
                          <div className="text-sm font-bold text-orange-900">{agent.years_experience || 'N/A'}</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2">
                          <div className="text-xs font-medium text-orange-800">📋 Plan</div>
                          <div className="text-sm font-bold text-orange-900">{getPlanDisplayName(agent.selected_plan)}</div>
                        </div>
                      </div>

                      {/* Company Info */}
                      {agent.company_name && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-800 mb-1">🏢 Company</h4>
                          <p className="text-sm text-gray-600">{agent.company_name}</p>
                        </div>
                      )}

                      {/* License Info */}
                      {(agent.license_number || agent.license_type) && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-800 mb-1">📜 License</h4>
                          <p className="text-sm text-gray-600">
                            {agent.license_type && `${agent.license_type}: `}
                            {agent.license_number || 'Not provided'}
                          </p>
                        </div>
                      )}

                      {/* Specialties */}
                      {agent.specialties && (
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-800 mb-1">⭐ Specialties</h4>
                          <p className="text-sm text-gray-600">{agent.specialties}</p>
                        </div>
                      )}

                      {/* References */}
                      <div className="mb-4 border-t border-gray-200 pt-4">
                        <button
                          onClick={() => {
                            setExpandedAgentReferences(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(agent.id)) {
                                newSet.delete(agent.id);
                              } else {
                                newSet.add(agent.id);
                              }
                              return newSet;
                            });
                          }}
                          className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <h4 className="text-xs font-semibold text-gray-800">👥 References</h4>
                          <svg
                            className={`w-4 h-4 text-gray-600 transition-transform ${
                              expandedAgentReferences.has(agent.id) ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>

                        {expandedAgentReferences.has(agent.id) && (
                          <div className="mt-3 space-y-3">
                            {/* Reference 1 */}
                            {agent.reference1_name && (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="text-xs font-semibold text-blue-900 mb-2">Reference 1</div>
                                <div className="text-sm text-blue-800 space-y-1">
                                  <div><span className="font-medium">Name:</span> {agent.reference1_name}</div>
                                  {agent.reference1_phone && <div><span className="font-medium">Phone:</span> {agent.reference1_phone}</div>}
                                  {agent.reference1_email && <div><span className="font-medium">Email:</span> {agent.reference1_email}</div>}
                                </div>
                              </div>
                            )}
                            {/* Reference 2 */}
                            {agent.reference2_name && (
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <div className="text-xs font-semibold text-purple-900 mb-2">Reference 2</div>
                                <div className="text-sm text-purple-800 space-y-1">
                                  <div><span className="font-medium">Name:</span> {agent.reference2_name}</div>
                                  {agent.reference2_phone && <div><span className="font-medium">Phone:</span> {agent.reference2_phone}</div>}
                                  {agent.reference2_email && <div><span className="font-medium">Email:</span> {agent.reference2_email}</div>}
                                </div>
                              </div>
                            )}
                            {!agent.reference1_name && !agent.reference2_name && (
                              <p className="text-xs text-gray-500 italic">No references provided</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Application Info */}
                      <div className="bg-orange-50 rounded-lg p-3 mb-4">
                        <div className="text-xs font-medium text-orange-800 mb-1">Application Details</div>
                        <div className="text-sm text-orange-700">
                          <div className="flex items-center justify-between">
                            <span>📅 Applied:</span>
                            <span>{new Date(agent.submitted_at).toLocaleDateString()}</span>
                          </div>
                          {agent.target_region && (
                            <div className="flex items-center justify-between mt-1">
                              <span>🎯 Target:</span>
                              <span>{agent.target_region}</span>
                            </div>
                          )}
                          {agent.is_founding_member && (
                            <div className="mt-1 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                              🌟 Founding Member
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => approveAgent(agent.id)}
                            disabled={processingAgentId === agent.id}
                            className="w-full px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {processingAgentId === agent.id ? '⏳' : '✅'} Approve
                          </button>
                          <button
                            onClick={() => setShowAgentRejectModal(agent.id)}
                            disabled={processingAgentId === agent.id}
                            className="w-full px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            ❌ Reject
                          </button>
                        </div>
                        <button
                          onClick={() => markAsManuallyApproved(agent.id)}
                          disabled={processingAgentId === agent.id}
                          className="w-full px-3 py-2 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          🔧 Mark as Manually Approved
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FSBO Applications Section */}
        {activeSection === 'fsbo' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏠 FSBO Applications</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pending FSBO Applications</h3>
                  <p className="text-sm text-gray-600">For Sale By Owner applications awaiting approval</p>
                </div>
                <button
                  onClick={loadOwnerApplications}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Pending FSBO</div>
                  <div className="text-2xl font-black text-blue-900">{pendingOwners.filter(o => o.user_type === 'owner').length}</div>
                  <div className="text-xs text-blue-700">Awaiting Review</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">Your Authority</div>
                  <div className="text-2xl font-black text-green-900">
                    {permissions?.canViewAllCountries ? 'ALL' : (permissions?.countryFilter || 'Limited')}
                  </div>
                  <div className="text-xs text-green-700">Review Access</div>
                </div>
              </div>

              {/* FSBO Applications Grid */}
              {pendingOwners.filter(o => o.user_type === 'owner').length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <div className="text-4xl mb-3">🏠</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">No Pending FSBO Applications</h4>
                  <p className="text-gray-600 text-sm">All FSBO applications have been processed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingOwners.filter(o => o.user_type === 'owner').map((owner) => (
                    <div key={owner.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                      {/* Owner Header */}
                      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-3 py-1 text-white text-xs font-bold rounded-full bg-blue-500">
                            🏠 FSBO APPLICATION
                          </span>
                          <span className="text-xs text-blue-700">
                            {owner.country_id || 'GY'}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {`${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Unknown Applicant'}
                        </h3>
                        <p className="text-sm text-gray-600">{owner.email || 'No email'}</p>
                      </div>

                      {/* Owner Details */}
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3 text-center mb-4">
                          <div className="rounded-lg p-2 bg-blue-50">
                            <div className="text-xs font-medium text-blue-800">📞 Phone</div>
                            <div className="text-sm font-bold text-blue-900">{owner.phone || 'N/A'}</div>
                          </div>
                          <div className="rounded-lg p-2 bg-blue-50">
                            <div className="text-xs font-medium text-blue-800">📋 Plan</div>
                            <div className="text-sm font-bold text-blue-900">
                              {owner.plan ? owner.plan.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Standard'}
                            </div>
                          </div>
                        </div>

                        {/* Application Info */}
                        <div className="rounded-lg p-3 mb-4 bg-blue-50 border border-blue-100">
                          <div className="text-xs font-medium mb-2 text-blue-800">📋 Application Details</div>
                          <div className="text-sm text-blue-700 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>📅 Applied:</span>
                              <span className="font-mono">{new Date(owner.created_at).toLocaleDateString()}</span>
                            </div>
                            {owner.is_founding_member && (
                              <div className="mt-2 text-xs px-2 py-1 rounded bg-blue-200 text-blue-800 text-center font-semibold">
                                🌟 Founding Member
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Account Status */}
                        <div className="rounded-lg p-3 mb-4 bg-green-50 border border-green-200">
                          <div className="text-xs font-medium mb-2 text-green-800">✅ Status</div>
                          <div className="text-sm text-green-700">
                            <p className="font-semibold">Auto-Approved Account</p>
                            <p className="text-xs mt-1">User has immediate dashboard access to list properties</p>
                          </div>
                        </div>

                        {/* What This Approval Does */}
                        <div className="rounded-lg p-3 mb-4 bg-yellow-50 border border-yellow-200">
                          <div className="text-xs font-medium mb-2 text-yellow-800">⚠️ Before You Approve</div>
                          <div className="text-xs text-yellow-700">
                            <p className="mb-1"><strong>This approves:</strong> The user account status</p>
                            <p className="mb-1"><strong>This does NOT approve:</strong> Their property listings</p>
                            <p><strong>Next step:</strong> Check Properties tab for their pending listings</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => approveOwnerApplication(owner.id)}
                            disabled={processingOwnerId === owner.id}
                            className="w-full px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {processingOwnerId === owner.id ? '⏳' : '✅'} Approve
                          </button>
                          <button
                            onClick={() => setShowOwnerRejectModal(owner.id)}
                            disabled={processingOwnerId === owner.id}
                            className="w-full px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Landlords Applications Section */}
        {activeSection === 'landlords' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏢 Landlord Applications</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pending Landlord Applications</h3>
                  <p className="text-sm text-gray-600">Landlord applications awaiting approval</p>
                </div>
                <button
                  onClick={loadOwnerApplications}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-1">Pending Landlords</div>
                  <div className="text-2xl font-black text-purple-900">{pendingOwners.filter(o => o.user_type === 'landlord').length}</div>
                  <div className="text-xs text-purple-700">Awaiting Review</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">Your Authority</div>
                  <div className="text-2xl font-black text-green-900">
                    {permissions?.canViewAllCountries ? 'ALL' : (permissions?.countryFilter || 'Limited')}
                  </div>
                  <div className="text-xs text-green-700">Review Access</div>
                </div>
              </div>

              {/* Landlord Applications Grid */}
              {pendingOwners.filter(o => o.user_type === 'landlord').length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center">
                  <div className="text-4xl mb-3">🏢</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">No Pending Landlord Applications</h4>
                  <p className="text-gray-600 text-sm">All landlord applications have been processed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingOwners.filter(o => o.user_type === 'landlord').map((owner) => (
                    <div key={owner.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                      {/* Owner Header */}
                      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-3 py-1 text-white text-xs font-bold rounded-full bg-purple-500">
                            🏢 LANDLORD APPLICATION
                          </span>
                          <span className="text-xs text-purple-700">
                            {owner.country_id || 'GY'}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {`${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'Unknown Applicant'}
                        </h3>
                        <p className="text-sm text-gray-600">{owner.email || 'No email'}</p>
                      </div>

                      {/* Owner Details */}
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3 text-center mb-4">
                          <div className="rounded-lg p-2 bg-purple-50">
                            <div className="text-xs font-medium text-purple-800">📞 Phone</div>
                            <div className="text-sm font-bold text-purple-900">{owner.phone || 'N/A'}</div>
                          </div>
                          <div className="rounded-lg p-2 bg-purple-50">
                            <div className="text-xs font-medium text-purple-800">📋 Plan</div>
                            <div className="text-sm font-bold text-purple-900">
                              {owner.plan ? owner.plan.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Standard'}
                            </div>
                          </div>
                        </div>

                        {/* Application Info */}
                        <div className="rounded-lg p-3 bg-green-50 border border-green-200">
                          <div className="text-xs font-medium mb-1 text-green-800">✅ Auto-Approved</div>
                          <div className="text-sm text-green-700">
                            <div className="flex items-center justify-between">
                              <span>📅 Registered:</span>
                              <span>{new Date(owner.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-1 text-xs text-green-600">
                              Landlords receive instant dashboard access to manage properties
                            </div>
                            {owner.is_founding_member && (
                              <div className="mt-1 text-xs px-2 py-1 rounded bg-green-200 text-green-800">
                                🌟 Founding Member
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Section */}
        {activeSection === 'system' && permissions?.canAccessSystemSettings && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">🛠️ System Administration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🛠️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
                  <p className="text-gray-600 mb-4 text-sm">Core system configuration and management</p>
                  <Link href="/admin-dashboard/system-settings">
                    <button className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                      Open System Settings
                    </button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🩺</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Diagnostics</h3>
                  <p className="text-gray-600 mb-4 text-sm">System health monitoring and diagnostics</p>
                  <Link href="/admin-dashboard/diagnostic">
                    <button className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors">
                      Open Diagnostics
                    </button>
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🎬</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Videos</h3>
                  <p className="text-gray-600 mb-4 text-sm">Manage training videos for agents, landlords, and FSBO users</p>
                  <Link href="/admin-dashboard/training-videos">
                    <button className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors">
                      Manage Videos
                    </button>
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">📄</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Resources</h3>
                  <p className="text-gray-600 mb-4 text-sm">Manage downloadable PDFs and documents for agents, landlords, and FSBO users</p>
                  <Link href="/admin-dashboard/training-resources">
                    <button className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">
                      Manage Resources
                    </button>
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">📤</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Monitoring</h3>
                  <p className="text-gray-600 mb-4 text-sm">Monitor property image uploads and manage orphaned files</p>
                  <Link href="/admin/upload-monitoring">
                    <button className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                      View Upload Monitoring
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">❌ Reject Property</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a clear reason for rejecting this property. This will help the owner understand what needs to be fixed.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] mb-4"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => showRejectModal && rejectProperty(showRejectModal, rejectReason)}
                disabled={!rejectReason.trim() || processingPropertyId === showRejectModal}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold disabled:opacity-50"
              >
                {processingPropertyId === showRejectModal ? '⏳ Processing...' : '❌ Reject Property'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Reject Modal */}
      {showAgentRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">❌ Reject Agent Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a clear reason for rejecting this agent application. This will help the applicant understand what needs to be improved.
            </p>
            <textarea
              value={agentRejectReason}
              onChange={(e) => setAgentRejectReason(e.target.value)}
              placeholder="Enter reason for rejection (e.g., insufficient experience, missing documentation, etc.)..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] mb-4"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowAgentRejectModal(null);
                  setAgentRejectReason("");
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => showAgentRejectModal && rejectAgent(showAgentRejectModal, agentRejectReason)}
                disabled={!agentRejectReason.trim() || processingAgentId === showAgentRejectModal}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold disabled:opacity-50"
              >
                {processingAgentId === showAgentRejectModal ? '⏳ Processing...' : '❌ Reject Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Application Reject Modal - Enhanced */}
      {showOwnerRejectModal && (() => {
        const application = pendingOwners.find(a => a.id === showOwnerRejectModal);
        const applicantName = application
          ? `${application.first_name || ''} ${application.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown';
        const userTypeLabel = application?.user_type === 'landlord' ? 'Landlord' : 'FSBO';

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Reject Application</h3>
                <button
                  onClick={() => {
                    setShowOwnerRejectModal(null);
                    setOwnerRejectType('needs_correction');
                    setOwnerRejectReasonDropdown("");
                    setOwnerRejectDetails("");
                    setOwnerRejectSendEmail(true);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  &times;
                </button>
              </div>

              {/* Applicant Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600">
                  <p><strong>Applicant:</strong> {applicantName}</p>
                  <p><strong>Email:</strong> {application?.email || 'N/A'}</p>
                  <p><strong>Type:</strong> {userTypeLabel}</p>
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Rejection Type Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Type:</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="rejectionType"
                      value="needs_correction"
                      checked={ownerRejectType === 'needs_correction'}
                      onChange={() => setOwnerRejectType('needs_correction')}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Needs Corrections</span>
                      <p className="text-xs text-gray-500">User can fix issues and resubmit</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="rejectionType"
                      value="permanent"
                      checked={ownerRejectType === 'permanent'}
                      onChange={() => setOwnerRejectType('permanent')}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Permanent Rejection</span>
                      <p className="text-xs text-gray-500">Application is permanently denied</p>
                    </div>
                  </label>
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Reason Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection: <span className="text-red-500">*</span>
                </label>
                <select
                  value={ownerRejectReasonDropdown}
                  onChange={(e) => setOwnerRejectReasonDropdown(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  <option value="">Select a reason...</option>
                  {OWNER_REJECTION_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Details */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ownerRejectType === 'needs_correction'
                    ? 'What needs to be corrected:'
                    : 'Additional Details:'}
                </label>
                <textarea
                  value={ownerRejectDetails}
                  onChange={(e) => setOwnerRejectDetails(e.target.value)}
                  placeholder={ownerRejectType === 'needs_correction'
                    ? "Describe what the applicant needs to fix..."
                    : "Provide additional context for this rejection..."}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px]"
                />
              </div>

              {/* Send Email Checkbox */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ownerRejectSendEmail}
                    onChange={(e) => setOwnerRejectSendEmail(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Send email notification to applicant</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowOwnerRejectModal(null);
                    setOwnerRejectType('needs_correction');
                    setOwnerRejectReasonDropdown("");
                    setOwnerRejectDetails("");
                    setOwnerRejectSendEmail(true);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => showOwnerRejectModal && rejectOwnerApplication(
                    showOwnerRejectModal,
                    ownerRejectType,
                    ownerRejectReasonDropdown,
                    ownerRejectDetails,
                    ownerRejectSendEmail
                  )}
                  disabled={!ownerRejectReasonDropdown || processingOwnerId === showOwnerRejectModal}
                  className={`flex-1 px-4 py-3 text-white rounded-xl transition-colors font-bold disabled:opacity-50 ${
                    ownerRejectType === 'permanent'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {processingOwnerId === showOwnerRejectModal
                    ? '... Processing...'
                    : ownerRejectType === 'permanent'
                      ? 'Reject Application'
                      : 'Request Corrections'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span className="font-medium">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-4 text-red-200 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}