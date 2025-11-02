export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PropertyData {
  title?: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  price: string;
  location: string;
  squareFootage?: string;
  features: string[];
  rentalType?: string;
  tone?: 'professional' | 'friendly' | 'luxury' | 'casual';
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const propertyData: PropertyData = await request.json();
    
    // Validate required fields
    if (!propertyData.propertyType || !propertyData.bedrooms || !propertyData.bathrooms) {
      return NextResponse.json({ 
        error: 'Missing required fields: propertyType, bedrooms, bathrooms' 
      }, { status: 400 });
    }

    const tone = propertyData.tone || 'professional';
    const toneInstructions = {
      professional: 'Use a professional, business-like tone suitable for real estate listings.',
      friendly: 'Use a warm, friendly tone that makes potential tenants feel welcome.',
      luxury: 'Use an upscale, premium tone that emphasizes luxury and exclusivity.',
      casual: 'Use a relaxed, conversational tone that feels approachable and laid-back.'
    };

    const prompt = `Generate a compelling property description for a rental listing with the following details:

Property Type: ${propertyData.propertyType}
Bedrooms: ${propertyData.bedrooms}
Bathrooms: ${propertyData.bathrooms}
${propertyData.price ? `Price: ${propertyData.price}` : ''}
${propertyData.location ? `Location: ${propertyData.location}` : ''}
${propertyData.squareFootage ? `Size: ${propertyData.squareFootage} sq ft` : ''}
${propertyData.rentalType ? `Rental Type: ${propertyData.rentalType}` : ''}
${propertyData.features.length > 0 ? `Features: ${propertyData.features.join(', ')}` : ''}

Instructions:
- ${toneInstructions[tone]}
- Write 3-4 paragraphs (150-250 words total)
- Highlight the best features and amenities
- Include location benefits if location is provided
- Make it engaging and appealing to potential renters
- Focus on lifestyle benefits and what makes this property special
- Use active voice and vivid descriptions
- End with a call to action

Do not include pricing information in the description as this will be displayed separately.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional real estate copywriter specializing in rental property descriptions. Create engaging, accurate, and compelling descriptions that attract quality tenants."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const description = completion.choices[0]?.message?.content?.trim();

    if (!description) {
      return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      description: description
    });

  } catch (error: any) {
    console.error('AI Description Generation Error:', error.message);
    
    // Handle specific OpenAI API errors
    if (error?.error?.code === 'invalid_api_key') {
      return NextResponse.json({ 
        error: 'Invalid OpenAI API key. Please check configuration.' 
      }, { status: 401 });
    }
    
    if (error?.error?.code === 'insufficient_quota') {
      return NextResponse.json({ 
        error: 'OpenAI quota exceeded. Please check your account billing.' 
      }, { status: 429 });
    }

    if (error?.error?.code === 'rate_limit_exceeded') {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      }, { status: 429 });
    }

    if (error?.error?.code === 'model_overloaded') {
      return NextResponse.json({ 
        error: 'AI service temporarily overloaded. Please try again.' 
      }, { status: 503 });
    }

    // Generic error handling
    return NextResponse.json({ 
      error: `AI generation failed: ${error.message || 'Unknown error'}. Please try again.`
    }, { status: 500 });
  }
}