export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface BioQuestionnaireData {
  agentName: string;
  company?: string;
  yearsExperience?: number;
  // Questionnaire answers (all tap-based selections)
  motivation: string[];
  motivation_other?: string;
  propertyTypes: string[];
  neighborhoods: string[];
  buyerTypes: string[];
  strengths: string[];
  strengths_other?: string;
  licensed: string[];
  languages: string[];
  personalTouch: string[];
  personal_touch_other?: string;
  communityInvolvement: string[];
  additionalNote?: string; // The one optional short text field
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const data: BioQuestionnaireData = await request.json();

    if (!data.agentName) {
      return NextResponse.json({ error: 'Missing agent name' }, { status: 400 });
    }

    const prompt = buildBioPrompt(data);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional copywriter specializing in real estate agent bios for the Caribbean market, specifically Guyana. Write compelling, authentic bios that build trust and authority. The bio should feel personal and warm, not corporate or stiff. Use third person. Write 2-3 short paragraphs (120-200 words total). Do not use quotation marks. Do not invent facts — only use the information provided.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.8,
      n: 3, // Generate 3 variations
    });

    const bios = completion.choices
      .map((choice) => choice.message?.content?.trim())
      .filter(Boolean);

    if (bios.length === 0) {
      return NextResponse.json({ error: 'Failed to generate bio' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bios,
    });
  } catch (error: any) {
    console.error('AI Bio Generation Error:', error.message);

    if (error?.error?.code === 'invalid_api_key') {
      return NextResponse.json({ error: 'Invalid OpenAI API key.' }, { status: 401 });
    }
    if (error?.error?.code === 'insufficient_quota') {
      return NextResponse.json({ error: 'OpenAI quota exceeded.' }, { status: 429 });
    }
    if (error?.error?.code === 'rate_limit_exceeded') {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again.' }, { status: 429 });
    }

    return NextResponse.json({
      error: `AI generation failed: ${error.message || 'Unknown error'}`,
    }, { status: 500 });
  }
}

function buildBioPrompt(data: BioQuestionnaireData): string {
  const lines: string[] = [];

  lines.push(`Write a professional real estate agent bio for ${data.agentName}.`);

  if (data.company) {
    lines.push(`They work with ${data.company}.`);
  }

  if (data.yearsExperience) {
    lines.push(`They have ${data.yearsExperience}+ years of experience in real estate.`);
  }

  if (data.motivation.length > 0) {
    const motivations = data.motivation.filter(m => m !== 'Other');
    if (data.motivation_other) motivations.push(data.motivation_other);
    if (motivations.length > 0) lines.push(`What drives them in real estate: ${motivations.join(', ')}.`);
  }

  if (data.propertyTypes.length > 0) {
    lines.push(`They specialize in: ${data.propertyTypes.join(', ')}.`);
  }

  if (data.neighborhoods.length > 0) {
    lines.push(`Their key areas/neighborhoods: ${data.neighborhoods.join(', ')}.`);
  }

  if (data.buyerTypes.length > 0) {
    lines.push(`They primarily work with: ${data.buyerTypes.join(', ')}.`);
  }

  if (data.strengths.length > 0) {
    const strengths = data.strengths.filter(s => s !== 'Other — describe in your own words');
    if (data.strengths_other) strengths.push(data.strengths_other);
    if (strengths.length > 0) lines.push(`What sets them apart: ${strengths.join(', ')}.`);
  }

  if (data.licensed?.length > 0) {
    const isLicensed = data.licensed[0]?.startsWith('Yes');
    if (isLicensed) {
      lines.push('They are a licensed real estate agent.');
    }
  }

  if (data.languages.length > 0) {
    lines.push(`Languages spoken: ${data.languages.join(', ')}.`);
  }

  if (data.personalTouch.length > 0) {
    const touches = data.personalTouch.filter(t => t !== 'Other — describe your style');
    if (data.personal_touch_other) touches.push(data.personal_touch_other);
    if (touches.length > 0) lines.push(`Personal style: ${touches.join(', ')}.`);
  }

  if (data.communityInvolvement.length > 0) {
    lines.push(`Community involvement: ${data.communityInvolvement.join(', ')}.`);
  }

  if (data.additionalNote) {
    lines.push(`Additional note from the agent: "${data.additionalNote}"`);
  }

  return lines.join('\n');
}
