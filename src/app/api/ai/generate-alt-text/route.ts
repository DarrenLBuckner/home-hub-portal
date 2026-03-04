export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { generateAltText } from '@/lib/ai/generateAltText';

interface AltTextRequest {
  imageUrl: string;
  propertyType?: string;
  listingType?: string;
  location?: string;
  neighborhood?: string;
  bedrooms?: number;
  bathrooms?: number;
  title?: string;
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const data: AltTextRequest = await request.json();

    if (!data.imageUrl) {
      return NextResponse.json({ error: 'Missing required field: imageUrl' }, { status: 400 });
    }

    const altText = await generateAltText(data.imageUrl, {
      propertyType: data.propertyType,
      listingType: data.listingType,
      location: data.location,
      neighborhood: data.neighborhood,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      title: data.title,
    });

    if (!altText) {
      return NextResponse.json({ error: 'Failed to generate alt text' }, { status: 500 });
    }

    return NextResponse.json({ success: true, altText });
  } catch (error: any) {
    console.error('AI Alt Text Generation Error:', error.message);
    return NextResponse.json({
      error: `AI generation failed: ${error.message || 'Unknown error'}`,
    }, { status: 500 });
  }
}
