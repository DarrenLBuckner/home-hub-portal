export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TitleRequestData {
  propertyType: string;
  propertyCategory?: 'residential' | 'commercial';
  listingType?: 'sale' | 'rent';
  // Residential fields
  bedrooms?: string;
  bathrooms?: string;
  // Commercial fields
  commercialType?: string;
  floorSize?: string;
  // Common fields
  price?: string;
  location?: string;
  neighborhood?: string;
  features?: string[];
  tone?: 'professional' | 'friendly' | 'luxury' | 'casual';
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const data: TitleRequestData = await request.json();

    if (!data.propertyType) {
      return NextResponse.json({
        error: 'Missing required field: propertyType'
      }, { status: 400 });
    }

    const isCommercial = data.propertyCategory === 'commercial';
    const isForSale = data.listingType === 'sale';
    const tone = data.tone || 'professional';

    const toneInstructions = {
      professional: 'Use professional, business-appropriate language.',
      friendly: 'Use warm, welcoming language that feels approachable.',
      luxury: 'Use upscale, premium language that conveys exclusivity.',
      casual: 'Use relaxed, conversational language.'
    };

    // Build context for the AI
    const propertyDetails: string[] = [];

    if (isCommercial) {
      if (data.commercialType) propertyDetails.push(`Commercial Type: ${data.commercialType}`);
      if (data.floorSize) propertyDetails.push(`Floor Size: ${data.floorSize} sq ft`);
    } else {
      if (data.bedrooms) propertyDetails.push(`Bedrooms: ${data.bedrooms}`);
      if (data.bathrooms) propertyDetails.push(`Bathrooms: ${data.bathrooms}`);
    }

    if (data.location) propertyDetails.push(`City/Region: ${data.location}`);
    if (data.neighborhood) propertyDetails.push(`Neighborhood: ${data.neighborhood}`);
    if (data.price) propertyDetails.push(`Price: ${data.price}`);
    if (data.features && data.features.length > 0) {
      propertyDetails.push(`Key Features: ${data.features.slice(0, 5).join(', ')}`);
    }

    const prompt = `Generate exactly 3 compelling property listing titles for the following ${isForSale ? 'sale' : 'rental'} listing:

Property Type: ${data.propertyType}
${propertyDetails.join('\n')}

Instructions:
- ${toneInstructions[tone]}
- Each title should be 6-12 words maximum
- Make titles attention-grabbing and specific
- Include the neighborhood/location when provided
- Highlight the most appealing aspects
- ${isForSale ? 'Appeal to buyers looking for their next home or investment' : 'Appeal to renters seeking a quality place to live'}
- ${isCommercial ? 'Focus on business potential and professional appeal' : 'Focus on lifestyle and comfort'}
- DO NOT include pricing in titles
- DO NOT use generic phrases like "Don't Miss Out" or "Act Now"
- Each title should have a different angle/emphasis

Return ONLY the 3 titles, one per line, numbered 1-3. No additional text or explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a real estate marketing expert who creates concise, compelling property listing titles. You write titles that are specific, memorable, and highlight unique selling points without being generic or clickbait-y."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.8, // Slightly higher for more creative variety
    });

    const rawResponse = completion.choices[0]?.message?.content?.trim();

    if (!rawResponse) {
      return NextResponse.json({ error: 'Failed to generate titles' }, { status: 500 });
    }

    // Parse the numbered list into an array
    const titles = rawResponse
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbering
      .filter(line => line.length > 0)
      .slice(0, 3); // Ensure max 3 titles

    if (titles.length === 0) {
      return NextResponse.json({ error: 'Failed to parse generated titles' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      titles: titles
    });

  } catch (error: any) {
    console.error('AI Title Generation Error:', error.message);

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
