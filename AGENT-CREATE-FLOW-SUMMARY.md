# Agent Property Creation Flow - Technical Summary

**Date:** January 30, 2026
**Purpose:** Planning session reference document
**Repo:** portal-home-hub

---

## File Structure Overview

```
src/app/dashboard/
├── agent/
│   └── create-property/
│       ├── page.tsx                    # Main wizard container (6 steps)
│       └── components/
│           ├── Step1BasicInfo.tsx      # Category, Type, Listing Type, Price
│           ├── Step2Details.tsx        # Beds/Baths, Size, Amenities, Description + AI
│           ├── Step3Location.tsx       # Location, Address, Title + AI
│           ├── Step4Photos.tsx         # Image upload
│           ├── Step5Contact.tsx        # Agent & Owner contact info
│           └── Step6Review.tsx         # Review all + Submit
│
├── owner/
│   └── create-property/
│       ├── page.tsx                    # Similar 6-step wizard
│       └── components/
│           ├── Step1BasicInfo.tsx      # Same structure, fewer property types
│           ├── Step2Details.tsx        # Has AI Description (no AI Title)
│           ├── Step3Location.tsx       # NO AI Title Suggester
│           ├── Step4Photos.tsx
│           ├── Step5Contact.tsx
│           └── Step6Review.tsx         # Has ownership confirmation
│
src/components/
├── AIDescriptionAssistant.tsx          # Shared AI description component
└── AITitleSuggester.tsx                # Shared AI title component

src/app/api/ai/
├── generate-description/route.ts       # OpenAI API for descriptions
└── generate-title/route.ts             # OpenAI API for titles
```

---

## Wizard Steps - Detailed Breakdown

### Step 1: Basic Information
**File:** `Step1BasicInfo.tsx`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Property Category | Toggle | Yes | Residential / Commercial |
| Property Type | Grid Select | Yes | 11 residential or 9 commercial options |
| Listing Type | Toggle | Yes | Sale / Rent (residential) / Lease (commercial) |
| Price | Number Input | Yes | Dynamic label based on listing type |

**Property Types:**
- **Residential (11):** House, Duplex, Apartment, Townhouse, Condo, Villa, Bungalow, Cottage, Multi-family, Land, Farmland
- **Commercial (9):** Office, Retail, Warehouse, Industrial, Mixed Use, Restaurant, Medical, Land, Agricultural

---

### Step 2: Property Details
**File:** `Step2Details.tsx`

| Field | Type | Required | Condition |
|-------|------|----------|-----------|
| Bedrooms | Number | Yes* | *Only for residential non-land |
| Bathrooms | Number | Yes* | *Only for residential non-land |
| Commercial Type | Select | Yes* | *Only for commercial |
| Floor Size (sq ft) | Number | No | Commercial only |
| Parking Spaces | Number | No | Commercial only |
| Building Floor | Number | No | Commercial only |
| Number of Floors | Number | No | Commercial only |
| Loading Dock | Checkbox | No | Commercial only |
| Elevator Access | Checkbox | No | Commercial only |
| Climate Controlled | Checkbox | No | Commercial only |
| Garage Entrance | Checkbox | No | Commercial only |
| House/Building Size | Number + Unit | No | |
| Year Built | Number | No | |
| Lot Dimensions | Component | No | Auto-calculates area |
| Land Size | Number + Unit | No | |
| Amenities | Checkbox Grid | No | 20 residential / 15 commercial |
| Description | Textarea | Yes | Free text |
| **AI Description** | Button | No | Generates description |

**AI Description Assistant Location:** After amenities, before/near description textarea

---

### Step 3: Location
**File:** `Step3Location.tsx`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Country | Select | Yes | GlobalSouthLocationSelector |
| Region/City | Select | Yes | Dynamic based on country |
| Property Address | Text | Yes | Full address |
| Neighborhood/Area | Text | No | Used for AI title generation |
| Show Address Publicly | Checkbox | No | Privacy option |
| Property Title | Text | Yes | Main listing title |
| **AI Title Suggester** | Button | No | Agent only, generates 3 titles |
| Owner WhatsApp | Text | No | Agent only - duplicate protection |
| Owner Email | Text | No | Agent only - duplicate protection |

**AI Title Suggester Location:** Below the title input field (Agent flow only)

---

### Step 4: Photos
**File:** `Step4Photos.tsx`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Images | File Upload | Yes (1+) | EnhancedImageUpload component |

---

### Step 5: Contact
**File:** `Step5Contact.tsx`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Agent Email | Email | Yes | Pre-filled from auth |
| Agent WhatsApp | Text | Yes | With country code |

---

### Step 6: Review
**File:** `Step6Review.tsx`

| Element | Type | Notes |
|---------|------|-------|
| All Fields Summary | Display | Read-only review |
| Ownership Confirmation | Checkbox | Owner flow only |
| Submit Button | Button | Creates property |
| Save as Draft | Button | Saves incomplete |

---

## AI Generation - Complete Details

### AIDescriptionAssistant Component
**File:** `src/components/AIDescriptionAssistant.tsx`

**Props Interface:**
```typescript
interface AIDescriptionAssistantProps {
  propertyData: {
    propertyType: string;           // Required
    propertyCategory?: string;      // 'residential' | 'commercial'
    bedrooms: string;               // Required for residential
    bathrooms: string;              // Required for residential
    commercialType?: string;        // Required for commercial
    floorSize?: string;             // Required for commercial
    price: string;
    location: string;
    squareFootage?: string;
    features: string[];             // Amenities array
    rentalType?: string;
  };
  onDescriptionGenerated: (description: string) => void;
  currentDescription: string;
}
```

**Validation Logic:**
```typescript
// Smart validation based on property category
const isCommercial = propertyData.propertyCategory === 'commercial';
const hasRequiredFields = propertyData.propertyType && (
  isCommercial
    ? (propertyData.commercialType && propertyData.floorSize)
    : (propertyData.bedrooms && propertyData.bathrooms)
);
```

**Tone Options:**
- `professional` - Business-like, suitable for corporate listings
- `friendly` - Warm and welcoming, perfect for families
- `luxury` - Premium and exclusive, for high-end properties
- `casual` - Relaxed and approachable, easy-going vibe

**API Call:**
```typescript
const response = await fetch('/api/ai/generate-description', {
  method: 'POST',
  body: JSON.stringify({ ...propertyData, tone: selectedTone }),
});
const data = await response.json();
onDescriptionGenerated(data.description);
```

---

### AITitleSuggester Component
**File:** `src/components/AITitleSuggester.tsx`

**Props Interface:**
```typescript
interface AITitleSuggesterProps {
  propertyData: {
    propertyType: string;                    // Required
    propertyCategory?: 'residential' | 'commercial';
    listingType?: 'sale' | 'rent' | 'lease';
    bedrooms?: string;
    bathrooms?: string;
    commercialType?: string;
    floorSize?: string;
    price?: string;
    location?: string;
    neighborhood?: string;                   // Required for validation
    features?: string[];
  };
  onTitleSelected: (title: string) => void;
  currentTitle: string;
}
```

**Validation Logic:**
```typescript
const locationContext = propertyData.neighborhood || propertyData.location;
const hasRequiredFields = !!propertyData.propertyType && !!locationContext?.trim();
```

**Output:** Array of exactly 3 title suggestions

**API Call:**
```typescript
const response = await fetch('/api/ai/generate-title', {
  method: 'POST',
  body: JSON.stringify({ ...propertyData, tone: selectedTone }),
});
const data = await response.json();
setSuggestions(data.titles); // Array of 3 strings
```

---

## API Routes - OpenAI Integration

### Generate Description API
**File:** `src/app/api/ai/generate-description/route.ts`

| Setting | Value |
|---------|-------|
| Model | `gpt-4o-mini` |
| Temperature | 0.7 |
| Max Tokens | 400 |
| Output Length | 150-250 words (3-4 paragraphs) |

**Prompt Template (Residential):**
```
Generate a compelling property description for a rental listing...
Property Type: ${propertyType}
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
...
Instructions:
- ${toneInstructions[tone]}
- Write 3-4 paragraphs (150-250 words total)
- Highlight the best features and amenities
- Make it engaging and appealing to potential renters
- Focus on lifestyle benefits
- End with a call to action
Do not include pricing information.
```

**Prompt Template (Commercial):**
```
Generate a compelling commercial property description...
- Focus on business advantages and opportunities
- Highlight commercial features like accessibility, parking, utilities
- Include location benefits for business operations
- Appeal to business owners and entrepreneurs
```

---

### Generate Title API
**File:** `src/app/api/ai/generate-title/route.ts`

| Setting | Value |
|---------|-------|
| Model | `gpt-4o-mini` |
| Temperature | 0.8 (higher for variety) |
| Max Tokens | 150 |
| Output | Exactly 3 titles |

**Prompt Template:**
```
Generate exactly 3 compelling property listing titles...
Instructions:
- Each title should be 6-12 words maximum
- Make titles attention-grabbing and specific
- Include the neighborhood/location when provided
- DO NOT include pricing in titles
- DO NOT use generic phrases like "Don't Miss Out"
- Each title should have a different angle/emphasis
Return ONLY the 3 titles, one per line, numbered 1-3.
```

**Response Parsing:**
```typescript
const titles = rawResponse
  .split('\n')
  .map(line => line.replace(/^\d+\.\s*/, '').trim())
  .filter(line => line.length > 0)
  .slice(0, 3);
```

---

## Key Differences: Agent vs Owner Flow

| Feature | Agent | Owner |
|---------|-------|-------|
| Property Categories | Residential + Commercial | Residential only |
| Property Types | 20 total (11 res + 9 comm) | ~8 (some disabled) |
| Listing Types | Sale, Rent, Lease | Sale, Rent |
| AI Description | Yes (Step 2) | Yes (Step 2) |
| AI Title Suggester | Yes (Step 3) | **No** |
| Duplicate Protection | Yes (owner contact fields) | No |
| Ownership Confirmation | No | Yes (Step 6) |
| Commercial Fields | Full support | None |
| Admin Create-on-behalf | Yes (`for_user` param) | No |

---

## Integration Points Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     WIZARD FLOW                              │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Basic Info                                          │
│  └── Category, Type, Listing Type, Price                    │
│                                                              │
│  Step 2: Details ──────────────────────────────────────────►│
│  ├── Beds/Baths or Commercial fields                        │
│  ├── Size, Year, Lot Dimensions                             │
│  ├── Amenities (passed to AI)                               │
│  ├── Description textarea                                    │
│  └── [AIDescriptionAssistant] ──► /api/ai/generate-description
│       └── Inputs: type, beds, baths, features, location     │
│       └── Output: 150-250 word description                  │
│                                                              │
│  Step 3: Location ─────────────────────────────────────────►│
│  ├── Country, Region, Address                               │
│  ├── Neighborhood (passed to AI)                            │
│  ├── Title input                                            │
│  └── [AITitleSuggester] ──► /api/ai/generate-title          │
│       └── Inputs: type, neighborhood, listing type          │
│       └── Output: 3 title suggestions                       │
│                                                              │
│  Step 4: Photos                                              │
│  └── EnhancedImageUpload (with compression)                 │
│                                                              │
│  Step 5: Contact                                             │
│  └── Agent email/WhatsApp                                   │
│                                                              │
│  Step 6: Review & Submit                                     │
│  └── /api/properties/create                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Questions for Planning Session

1. **Should Owner flow get AI Title Suggester?** Currently only Agent has it.
2. **Should FSBO (simplified) flow get any AI features?** Currently has AIDescriptionAssistant only.
3. **Are 4 tone options sufficient?** (professional, friendly, luxury, casual)
4. **Should AI auto-trigger or stay manual?** Currently requires button click.
5. **Token limits adequate?** Description: 400, Title: 150
6. **Commercial prompts need refinement?** Different focus than residential.

---

## Related Files Not Covered

- `src/app/dashboard/landlord/create-property/page.tsx` - Single-page form with AI Description
- `src/app/dashboard/fsbo/create-listing/page.tsx` - Simplified single-page with AI Description
- `src/lib/imageCompression.ts` - Standalone compression utility
- `src/components/EnhancedImageUpload.tsx` - Image upload with built-in compression
