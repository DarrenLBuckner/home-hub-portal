import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface FranchiseApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  countryOfOrigin: string;
  currentCountry: string;
  targetMarketCountry: string;
  targetMarketRegion: string;
  currentProfession: string;
  yearsOfExperience: number;
  hasRealEstateExperience: boolean;
  realEstateExperienceDetails: string;
  hasBusinessOwnershipExperience: boolean;
  businessOwnershipDetails: string;
  hasFranchiseExperience: boolean;
  franchiseExperienceDetails: string;
  netWorthUsd: string;
  investmentCapacity: string;
  fundingSource: string;
  marketKnowledgeLevel: string;
  whyInterested: string;
  marketResearchCompleted: boolean;
  competitorsIdentified: string;
  targetLaunchTimeline: string;
  expectedRevenueYearOne: string;
  growthPlans: string;
  hasTeamIdentified: boolean;
  teamDetails: string;
  hasOfficeLocation: boolean;
  officeLocationDetails: string;
  marketingExperience: string;
  fullTimeCommitment: boolean;
  hoursPerWeek: number;
  otherBusinessCommitments: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: FranchiseApplicationData = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      return NextResponse.json(
        { error: 'Missing required personal information' },
        { status: 400 }
      );
    }

    if (!data.countryOfOrigin || !data.currentCountry || !data.targetMarketCountry) {
      return NextResponse.json(
        { error: 'Missing required geographic information' },
        { status: 400 }
      );
    }

    if (!data.netWorthUsd) {
      return NextResponse.json(
        { error: 'Net worth information is required' },
        { status: 400 }
      );
    }

    if (!data.whyInterested) {
      return NextResponse.json(
        { error: 'Please explain why you are interested in this opportunity' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Prepare data for database insertion
    const applicationData = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      date_of_birth: data.dateOfBirth || null,
      country_of_origin: data.countryOfOrigin,
      current_country: data.currentCountry,
      target_market_country: data.targetMarketCountry,
      target_market_region: data.targetMarketRegion || null,
      current_profession: data.currentProfession || null,
      years_of_experience: data.yearsOfExperience || 0,
      has_real_estate_experience: data.hasRealEstateExperience,
      real_estate_experience_details: data.realEstateExperienceDetails || null,
      has_business_ownership_experience: data.hasBusinessOwnershipExperience,
      business_ownership_details: data.businessOwnershipDetails || null,
      has_franchise_experience: data.hasFranchiseExperience,
      franchise_experience_details: data.franchiseExperienceDetails || null,
      net_worth_usd: data.netWorthUsd,
      investment_capacity: data.investmentCapacity || null,
      funding_source: data.fundingSource || null,
      market_knowledge_level: data.marketKnowledgeLevel || null,
      why_interested: data.whyInterested,
      market_research_completed: data.marketResearchCompleted,
      competitors_identified: data.competitorsIdentified || null,
      target_launch_timeline: data.targetLaunchTimeline || null,
      expected_revenue_year_one: data.expectedRevenueYearOne || null,
      growth_plans: data.growthPlans || null,
      has_team_identified: data.hasTeamIdentified,
      team_details: data.teamDetails || null,
      has_office_location: data.hasOfficeLocation,
      office_location_details: data.officeLocationDetails || null,
      marketing_experience: data.marketingExperience || null,
      full_time_commitment: data.fullTimeCommitment,
      hours_per_week: data.hoursPerWeek || 0,
      other_business_commitments: data.otherBusinessCommitments || null,
      status: 'submitted'
    };

    // Insert into database
    const { data: insertedData, error } = await supabase
      .from('franchise_applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    // Log the application submission for admin notification
    console.log('New franchise application submitted:', {
      id: insertedData.id,
      email: data.email,
      targetCountry: data.targetMarketCountry,
      netWorth: data.netWorthUsd,
      timeline: data.targetLaunchTimeline
    });

    // Send email notification to partnerships team
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0;">🌍 New Franchise Application</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">Portal Home Hub Partnership Inquiry</p>
            </div>

            <div style="background: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">📋 Application Summary</h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div><strong>Application ID:</strong> ${insertedData.id}</div>
                <div><strong>Submission Date:</strong> ${new Date().toLocaleString()}</div>
                <div><strong>Target Market:</strong> ${data.targetMarketCountry}</div>
                <div><strong>Timeline:</strong> ${data.targetLaunchTimeline || 'Not specified'}</div>
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">👤 Personal Information</h2>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Phone:</strong> ${data.phone}</p>
                <p><strong>Country of Origin:</strong> ${data.countryOfOrigin}</p>
                <p><strong>Current Location:</strong> ${data.currentCountry}</p>
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">🎯 Target Market</h2>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                <p><strong>Target Country:</strong> ${data.targetMarketCountry}</p>
                ${data.targetMarketRegion ? `<p><strong>Target Region:</strong> ${data.targetMarketRegion}</p>` : ''}
                <p><strong>Market Knowledge:</strong> ${data.marketKnowledgeLevel || 'Not specified'}</p>
                <p><strong>Market Research Completed:</strong> ${data.marketResearchCompleted ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">💼 Professional Background</h2>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                <p><strong>Current Profession:</strong> ${data.currentProfession || 'Not specified'}</p>
                <p><strong>Years of Experience:</strong> ${data.yearsOfExperience}</p>
                <p><strong>Real Estate Experience:</strong> ${data.hasRealEstateExperience ? 'Yes' : 'No'}</p>
                ${data.hasRealEstateExperience && data.realEstateExperienceDetails ? 
                  `<p><strong>Real Estate Details:</strong> ${data.realEstateExperienceDetails}</p>` : ''}
                <p><strong>Business Ownership Experience:</strong> ${data.hasBusinessOwnershipExperience ? 'Yes' : 'No'}</p>
                ${data.hasBusinessOwnershipExperience && data.businessOwnershipDetails ? 
                  `<p><strong>Business Details:</strong> ${data.businessOwnershipDetails}</p>` : ''}
                <p><strong>Franchise Experience:</strong> ${data.hasFranchiseExperience ? 'Yes' : 'No'}</p>
                ${data.hasFranchiseExperience && data.franchiseExperienceDetails ? 
                  `<p><strong>Franchise Details:</strong> ${data.franchiseExperienceDetails}</p>` : ''}
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">💰 Financial Information</h2>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                <p><strong>Net Worth (USD):</strong> ${data.netWorthUsd}</p>
                <p><strong>Investment Capacity:</strong> ${data.investmentCapacity || 'Not specified'}</p>
                <p><strong>Funding Source:</strong> ${data.fundingSource || 'Not specified'}</p>
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">🎯 Goals & Interest</h2>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                <p><strong>Why Interested:</strong></p>
                <div style="background: #f8fafc; padding: 10px; border-radius: 4px; margin: 5px 0;">
                  ${data.whyInterested}
                </div>
                <p><strong>Target Launch Timeline:</strong> ${data.targetLaunchTimeline || 'Not specified'}</p>
                <p><strong>Expected Year 1 Revenue:</strong> ${data.expectedRevenueYearOne || 'Not specified'}</p>
                ${data.growthPlans ? `
                  <p><strong>Growth Plans:</strong></p>
                  <div style="background: #f8fafc; padding: 10px; border-radius: 4px; margin: 5px 0;">
                    ${data.growthPlans}
                  </div>
                ` : ''}
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">👥 Team & Commitment</h2>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                <p><strong>Full-time Commitment:</strong> ${data.fullTimeCommitment ? 'Yes' : 'No'}</p>
                <p><strong>Hours per Week Available:</strong> ${data.hoursPerWeek}</p>
                <p><strong>Team Identified:</strong> ${data.hasTeamIdentified ? 'Yes' : 'No'}</p>
                ${data.hasTeamIdentified && data.teamDetails ? 
                  `<p><strong>Team Details:</strong> ${data.teamDetails}</p>` : ''}
                <p><strong>Office Location Identified:</strong> ${data.hasOfficeLocation ? 'Yes' : 'No'}</p>
                ${data.hasOfficeLocation && data.officeLocationDetails ? 
                  `<p><strong>Office Details:</strong> ${data.officeLocationDetails}</p>` : ''}
                ${data.marketingExperience ? 
                  `<p><strong>Marketing Experience:</strong> ${data.marketingExperience}</p>` : ''}
                ${data.otherBusinessCommitments ? 
                  `<p><strong>Other Commitments:</strong> ${data.otherBusinessCommitments}</p>` : ''}
              </div>
            </div>

            ${data.competitorsIdentified ? `
              <div style="margin-bottom: 25px;">
                <h2 style="color: #334155; margin: 0 0 15px 0;">🏢 Market Analysis</h2>
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                  <p><strong>Competitors Identified:</strong></p>
                  <div style="background: #f8fafc; padding: 10px; border-radius: 4px; margin: 5px 0;">
                    ${data.competitorsIdentified}
                  </div>
                </div>
              </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0;">
                📧 Reply to this email to begin the conversation with ${data.firstName} ${data.lastName}<br>
                📞 Direct contact: ${data.email} | ${data.phone}
              </p>
            </div>
          </div>
        </div>
      `;

      const emailText = `
NEW FRANCHISE APPLICATION - Portal Home Hub

Application ID: ${insertedData.id}
Submission Date: ${new Date().toLocaleString()}

APPLICANT INFORMATION:
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone}
Country of Origin: ${data.countryOfOrigin}
Current Location: ${data.currentCountry}

TARGET MARKET:
Target Country: ${data.targetMarketCountry}
${data.targetMarketRegion ? `Target Region: ${data.targetMarketRegion}` : ''}
Market Knowledge: ${data.marketKnowledgeLevel || 'Not specified'}
Market Research Completed: ${data.marketResearchCompleted ? 'Yes' : 'No'}

PROFESSIONAL BACKGROUND:
Current Profession: ${data.currentProfession || 'Not specified'}
Years of Experience: ${data.yearsOfExperience}
Real Estate Experience: ${data.hasRealEstateExperience ? 'Yes' : 'No'}
Business Ownership Experience: ${data.hasBusinessOwnershipExperience ? 'Yes' : 'No'}
Franchise Experience: ${data.hasFranchiseExperience ? 'Yes' : 'No'}

FINANCIAL INFORMATION:
Net Worth (USD): ${data.netWorthUsd}
Investment Capacity: ${data.investmentCapacity || 'Not specified'}
Funding Source: ${data.fundingSource || 'Not specified'}

WHY INTERESTED:
${data.whyInterested}

COMMITMENT & TIMELINE:
Target Launch: ${data.targetLaunchTimeline || 'Not specified'}
Full-time Commitment: ${data.fullTimeCommitment ? 'Yes' : 'No'}
Hours per Week Available: ${data.hoursPerWeek}
Expected Year 1 Revenue: ${data.expectedRevenueYearOne || 'Not specified'}

---
Contact the applicant directly at:
Email: ${data.email}
Phone: ${data.phone}
      `;

      await resend.emails.send({
        from: 'Portal Home Hub <noreply@portalhomehub.com>',
        to: ['partnerships@portalhomehub.com'],
        subject: `🌍 New Franchise Application: ${data.targetMarketCountry} - ${data.firstName} ${data.lastName}`,
        html: emailHtml,
        text: emailText,
      });

    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Continue execution even if email fails
    }

    return NextResponse.json({
      success: true,
      applicationId: insertedData.id,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve applications (admin only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get applications with pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('franchise_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve applications' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('franchise_applications')
      .select('*', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}