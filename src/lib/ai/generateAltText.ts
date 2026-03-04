import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PropertyContext {
  title?: string;
  propertyType?: string;
  listingType?: string;
  location?: string;
  neighborhood?: string;
  bedrooms?: number;
  bathrooms?: number;
  imageIndex?: number;
  totalImages?: number;
}

/**
 * Generate SEO-optimized alt text for a property image using AI vision.
 * Returns null if generation fails (non-blocking).
 */
export async function generateAltText(
  imageUrl: string,
  context: PropertyContext = {}
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not set, skipping alt text generation');
    return null;
  }

  try {
    const contextParts: string[] = [];
    if (context.propertyType) contextParts.push(`Property type: ${context.propertyType}`);
    if (context.listingType) contextParts.push(`Listing: for ${context.listingType}`);
    if (context.bedrooms) contextParts.push(`${context.bedrooms} bedrooms`);
    if (context.bathrooms) contextParts.push(`${context.bathrooms} bathrooms`);
    if (context.neighborhood) contextParts.push(`Neighborhood: ${context.neighborhood}`);
    if (context.location) contextParts.push(`Location: ${context.location}`);
    if (context.title) contextParts.push(`Listing title: ${context.title}`);

    const contextString = contextParts.length > 0
      ? `\n\nProperty context: ${contextParts.join('. ')}.`
      : '';

    const positionHint = context.imageIndex !== undefined && context.totalImages
      ? ` This is image ${context.imageIndex + 1} of ${context.totalImages} in the listing.`
      : '';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert writing alt text for real estate property images. Write concise, descriptive alt text (60-120 characters) that describes what is visible in the image. Include the property type and location when relevant. Do not start with "Image of" or "Photo of". Return ONLY the alt text, no quotes or explanation.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Generate alt text for this real estate property image.${contextString}${positionHint}`,
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 80,
      temperature: 0.3,
    });

    const altText = completion.choices[0]?.message?.content?.trim();

    if (!altText) {
      console.warn('⚠️ Empty alt text response for:', imageUrl);
      return null;
    }

    return altText;
  } catch (error: any) {
    console.error('❌ Alt text generation failed for image:', imageUrl, error?.message);
    return null;
  }
}

/**
 * Generate alt text for multiple images in parallel.
 * Returns a Map of imageUrl -> altText. Failed images will have null values.
 */
export async function generateAltTextBatch(
  imageUrls: string[],
  context: PropertyContext = {}
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  const promises = imageUrls.map(async (url, index) => {
    const altText = await generateAltText(url, {
      ...context,
      imageIndex: index,
      totalImages: imageUrls.length,
    });
    results.set(url, altText);
  });

  await Promise.allSettled(promises);
  return results;
}
