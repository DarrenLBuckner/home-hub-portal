# Progressive Save Gates: Alternative to Auto-Save
**Date**: November 17, 2025  
**Addendum to**: DRAFT_AUTOSAVE_SENIOR_DEVELOPER_ANALYSIS.md  
**Proposed by**: Project Owner (Darren/Qumar)  
**Analyzed by**: GitHub Copilot (Claude Sonnet 4.5)

---

## Executive Summary

**New Approach**: Instead of automatic saves, implement **mandatory save checkpoints** between form sections. Users cannot progress to the next section until they save their current progress.

**Key Concept**: "Save to Continue" - Save button unlocks the next section, blurs/disables future sections until current progress is saved.

**Existing Evidence**: Owner (FSBO) form **already uses this pattern** with a 6-step wizard that validates before allowing progress.

**Risk Level**: 🟢 **LOW (1.5/5)** - Simpler, more predictable, less prone to duplicates  
**Complexity**: 🟢 **LOW** - Pattern already exists, just needs draft integration  
**User Control**: ✅ **HIGH** - Explicit, clear expectations  
**Duplicate Risk**: 🟢 **VERY LOW** - Manual, deliberate saves only

---

## 1. EXISTING PATTERN IN OWNER FORM

### 1.1 Current Owner Form Architecture

**File**: `src/app/dashboard/owner/create-property/page.tsx` (582 lines)

**Structure**:
```
Step 1: Basic Info (title, description, price)
   ↓ [Validate + Next Button]
Step 2: Details (beds, baths, size, year)
   ↓ [Validate + Next Button]
Step 3: Location (region, city, neighborhood)
   ↓ [Validate + Next Button]
Step 4: Photos (image upload)
   ↓ [Validate + Next Button]
Step 5: Contact (email, WhatsApp)
   ↓ [Validate + Next Button]
Step 6: Review & Submit
   ↓ [Final Submission]
```

**Key Code Patterns**:

```typescript
// Line 20: Step state
const [currentStep, setCurrentStep] = useState(1);

// Lines 79-134: Step validation
const validateCurrentStep = () => {
  setError('');
  
  switch (currentStep) {
    case 1:
      if (!formData.title.trim()) {
        setError('Property title is required');
        return false;
      }
      if (!formData.description.trim()) {
        setError('Property description is required');
        return false;
      }
      if (!formData.price || isNaN(Number(formData.price))) {
        setError('Valid price is required');
        return false;
      }
      break;
    case 2:
      if (!formData.bedrooms || isNaN(Number(formData.bedrooms))) {
        setError('Number of bedrooms is required');
        return false;
      }
      // ... more validation
      break;
    // ... other steps
  }
  return true;
};

// Lines 136-139: Next button handler
const handleNext = () => {
  if (validateCurrentStep()) {
    setCurrentStep(currentStep + 1); // Only progresses if validation passes
  }
};

// Line 429: Step components render conditionally
{currentStep === 1 && <Step1BasicInfo formData={formData} setFormData={setFormData} />}
{currentStep === 2 && <Step2Details formData={formData} setFormData={setFormData} />}
{currentStep === 3 && <Step3Location formData={formData} setFormData={setFormData} />}
```

**Visual Progress Indicator** (Lines 448-476):
- Step numbers (1-6) with checkmarks for completed
- Progress bar showing percentage complete
- Current step highlighted in blue
- Completed steps highlighted in green
- Future steps grayed out

**What's Missing**: Draft save integration at each step

---

## 2. PROPOSED "SAVE TO CONTINUE" PATTERN

### 2.1 Core Concept

**User Flow**:
```
1. User fills out section (e.g., Basic Info)
2. User clicks "Save & Continue" button
3. System saves draft to database
4. System unlocks next section
5. Repeat for each section
```

**Key Behaviors**:
- ✅ **Explicit saves**: User knows exactly when data is saved
- ✅ **Visual feedback**: "Saving..." → "Saved ✓" → "Next section unlocked"
- ✅ **Gated progress**: Can't skip ahead without saving
- ✅ **No auto-magic**: No silent background saves creating confusion
- ✅ **Recovery friendly**: If user leaves, saved progress is preserved

### 2.2 Visual Design

**Button States**:

```
┌─────────────────────────────────────────────┐
│  Section 1: Basic Information               │
│  ┌─────────────────────────────────────┐   │
│  │ Title: [Beautiful 3BR House...]     │   │
│  │ Description: [Spacious home...]     │   │
│  │ Price: [500,000]                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  💾 Save & Continue to Property Details │ │
│  └───────────────────────────────────────┘ │
│     (Green button, prominent)              │
└─────────────────────────────────────────────┘

After click:

┌─────────────────────────────────────────────┐
│  Section 1: Basic Information ✓ Saved      │
│  (Content dimmed/readonly)                  │
│                                             │
│  ┌──────────────────┐                      │
│  │  ✏️ Edit Section  │                      │
│  └──────────────────┘                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Section 2: Property Details               │
│  (NOW UNLOCKED - was blurred before)       │
│  ┌─────────────────────────────────────┐   │
│  │ Bedrooms: [3]                        │   │
│  │ Bathrooms: [2]                       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  💾 Save & Continue to Location       │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Future Section (Locked)**:
```
┌─────────────────────────────────────────────┐
│  Section 3: Location              🔒 LOCKED │
│  ┌─────────────────────────────────────┐   │
│  │  Complete previous sections first    │   │
│  │  (Content blurred/disabled)          │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 2.3 Save Points (Checkpoints)

**Recommended Save Gates**:

1. **After Basic Info** (Title, Description, Price)
   - ~25% complete
   - Core property identification
   - Draft ID established

2. **After Property Details** (Beds, Baths, Size)
   - ~50% complete
   - Property specifications locked in
   - Updates existing draft

3. **After Location** (Region, City, Neighborhood)
   - ~75% complete
   - Geographic data saved
   - Updates existing draft

4. **After Photos Upload** (Images)
   - ~90% complete
   - Media preserved (special handling)
   - Updates existing draft

5. **Final Submit** (Review & Submit)
   - 100% complete
   - Converts draft to property
   - Deletes draft

**Why These Points**:
- ✅ Natural cognitive breaks in form filling
- ✅ Meaningful chunks of data (not arbitrary)
- ✅ ~25% intervals = predictable pattern
- ✅ Aligns with existing owner form structure
- ✅ Reduces save frequency (5 saves vs continuous auto-save)

---

## 3. COMPARISON: AUTO-SAVE VS SAVE GATES

| Factor | Auto-Save (Original) | Progressive Save Gates | Winner |
|--------|----------------------|------------------------|--------|
| **Duplicate Risk** | HIGH (20+ drafts) | LOW (5 max) | 🟢 Gates |
| **User Control** | LOW (magic) | HIGH (explicit) | 🟢 Gates |
| **Predictability** | LOW (when does it save?) | HIGH (save = progress) | 🟢 Gates |
| **Data Loss Risk** | LOW (continuous) | MEDIUM (per checkpoint) | 🟡 Auto-Save |
| **Complexity** | HIGH (debounce, timers) | LOW (button click) | 🟢 Gates |
| **Testing Effort** | HIGH (many edge cases) | LOW (deterministic) | 🟢 Gates |
| **Breaking Risk** | MEDIUM | LOW | 🟢 Gates |
| **Storage Bloat** | MEDIUM (many saves) | LOW (5 saves) | 🟢 Gates |
| **User Training** | LOW (invisible) | MEDIUM (learn pattern) | 🟡 Auto-Save |
| **Error Recovery** | HIGH (latest save) | MEDIUM (last checkpoint) | 🟡 Auto-Save |

**Overall Score**:
- **Auto-Save**: 5/10 (good protection, high complexity)
- **Save Gates**: 8/10 (good balance, simple implementation)

---

## 4. IMPLEMENTATION PLAN

### 4.1 Agent Create Property Conversion

**Current State**: Long single-page form (1614 lines)

**Proposed Structure**:

```typescript
// Add step state
const [currentSection, setCurrentSection] = useState(1);
const [savedSections, setSavedSections] = useState<number[]>([]);

// Section definitions
const SECTIONS = {
  1: { name: 'Basic Info', fields: ['title', 'description', 'price', 'property_type'] },
  2: { name: 'Property Details', fields: ['bedrooms', 'bathrooms', 'house_size_value'] },
  3: { name: 'Location', fields: ['region', 'city', 'neighborhood'] },
  4: { name: 'Photos', fields: ['images'] },
  5: { name: 'Additional Details', fields: ['amenities', 'year_built', 'lot_dimensions'] }
};

// Check if section can be unlocked
const isSectionUnlocked = (sectionNum: number): boolean => {
  if (sectionNum === 1) return true; // First section always unlocked
  return savedSections.includes(sectionNum - 1); // Unlock if previous saved
};

// Save & Continue handler
const handleSaveAndContinue = async (sectionNum: number) => {
  try {
    setAutoSaveStatus('saving');
    
    // Validate current section fields
    const section = SECTIONS[sectionNum];
    const isValid = validateSectionFields(section.fields);
    if (!isValid) {
      setError('Please complete all required fields');
      return;
    }
    
    // Save draft
    const result = await saveDraft({
      ...form,
      images: [], // Don't save File objects
      currency: currencyCode,
      currency_symbol: currencySymbol,
      country: selectedCountry
    }, currentDraftId);
    
    if (result.success) {
      // Mark section as saved
      setSavedSections(prev => [...new Set([...prev, sectionNum])]);
      
      // Store/update draft ID
      if (result.draftId && !currentDraftId) {
        setCurrentDraftId(result.draftId);
      }
      
      // Unlock next section
      setCurrentSection(sectionNum + 1);
      
      setAutoSaveStatus('saved');
      setError('');
      
      // Show success message
      console.log(`✅ Section ${sectionNum} saved, section ${sectionNum + 1} unlocked`);
      
      // Smooth scroll to next section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setAutoSaveStatus('error');
      setError(result.error || 'Failed to save progress');
    }
  } catch (error) {
    console.error('❌ Save error:', error);
    setAutoSaveStatus('error');
    setError('Failed to save. Please try again.');
  }
};
```

**UI Changes**:

```tsx
{/* Section 1: Basic Info */}
<div className={`
  bg-white p-6 rounded-lg shadow-sm border-l-4 
  ${currentSection >= 1 ? 'border-blue-500' : 'border-gray-300 opacity-50 pointer-events-none'}
`}>
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-xl font-semibold flex items-center gap-2">
      📍 Basic Information
    </h3>
    {savedSections.includes(1) && (
      <span className="text-green-600 text-sm flex items-center gap-1">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
        </svg>
        Saved
      </span>
    )}
  </div>
  
  {/* Form fields... */}
  
  {/* Save & Continue Button */}
  <div className="mt-6 flex justify-end">
    <button
      type="button"
      onClick={() => handleSaveAndContinue(1)}
      disabled={autoSaveStatus === 'saving'}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
    >
      {autoSaveStatus === 'saving' ? (
        <>
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          Saving...
        </>
      ) : (
        <>
          💾 Save & Continue to Property Details
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </>
      )}
    </button>
  </div>
</div>

{/* Section 2: Property Details (Locked until Section 1 saved) */}
<div className={`
  bg-white p-6 rounded-lg shadow-sm border-l-4 mt-8
  ${isSectionUnlocked(2) 
    ? 'border-blue-500' 
    : 'border-gray-300 opacity-50 blur-sm pointer-events-none'
  }
`}>
  {!isSectionUnlocked(2) && (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-2">🔒</div>
        <p className="text-gray-600 font-semibold">Complete previous section to unlock</p>
      </div>
    </div>
  )}
  
  <h3 className="text-xl font-semibold mb-4">
    🏠 Property Details
  </h3>
  
  {/* Form fields... */}
</div>
```

### 4.2 Code Changes Summary

**Files to Modify**:
1. `src/app/dashboard/agent/create-property/page.tsx` (~150 lines changed)
2. `src/app/dashboard/landlord/create-property/page.tsx` (~100 lines changed)
3. Owner form already has pattern, just needs draft integration (~50 lines)

**New State Variables**:
```typescript
const [currentSection, setCurrentSection] = useState(1);
const [savedSections, setSavedSections] = useState<number[]>([]);
```

**New Functions**:
```typescript
const isSectionUnlocked = (sectionNum: number): boolean => { /* ... */ };
const validateSectionFields = (fields: string[]): boolean => { /* ... */ };
const handleSaveAndContinue = async (sectionNum: number) => { /* ... */ };
const handleEditSection = (sectionNum: number) => { /* ... */ };
```

**Estimated Effort**:
- Agent form: 2-3 hours
- Landlord form: 1.5-2 hours
- Owner form: 1 hour
- Testing: 2 hours
- **Total**: 6-8 hours

---

## 5. ADVANTAGES OVER AUTO-SAVE

### 5.1 Technical Advantages

1. **No Debouncing Needed**: Saves happen on explicit button clicks, not form changes
2. **No Change Detection**: Don't need to compare form state between renders
3. **No Timers**: No interval-based saves creating race conditions
4. **Predictable API Calls**: Exactly 5 save calls per property creation (vs potentially 20+ with auto-save)
5. **Easier Testing**: Deterministic behavior (click button = save happens)
6. **Simpler State Management**: Just track section numbers, not change history
7. **No Zombie Saves**: User can't accidentally trigger multiple saves by typing fast

### 5.2 User Experience Advantages

1. **Clear Expectations**: "Save to continue" is universally understood
2. **Progress Visibility**: Visual checkmarks show what's saved
3. **Control**: User decides when to save (not system)
4. **No Surprises**: No silent background operations
5. **Error Clarity**: If save fails, it's obvious (button didn't work)
6. **Motivation**: Unlocking next section feels like progress
7. **Undo Friendly**: Can abandon section without auto-save pollution

### 5.3 Business Advantages

1. **Lower Database Load**: 5 saves vs 20+ saves
2. **Less Storage**: Fewer draft records
3. **Easier Support**: "Did you click save?" is clear diagnostic
4. **Training Simple**: "Complete section, click save, move forward"
5. **No Duplicate Cleanup**: Maximum 1 draft per property attempt
6. **Cost Effective**: Fewer API calls, less bandwidth

---

## 6. ADDRESSING DATA LOSS CONCERNS

**Concern**: "What if user's computer crashes between checkpoints?"

**Response**:
1. **Browser Tab Crash**: BeforeUnload warning still works ("You have unsaved changes")
2. **Power Outage**: No solution perfect for this (even auto-save could be mid-save)
3. **Network Failure**: Retry logic in save function, shows clear error
4. **Acceptable Risk**: 20-25% of work vs 100% of work is better
5. **User Awareness**: Explicit save = user knows last safe point

**Mitigation**:
- Add "Save Draft" button at top of form (always visible, optional)
- Allow saving incomplete sections (warnings instead of errors)
- Show "last saved" timestamp
- Browser localStorage backup (emergency recovery)

**Comparison**:

| Scenario | Auto-Save | Save Gates | Outcome |
|----------|-----------|------------|---------|
| Accidental close | Saved | Warning + saved checkpoints | 🟡 Gates (some loss) |
| Network failure | Retry auto | Retry visible | 🟢 Gates (clearer) |
| System crash | Lost since last auto-save | Lost since last checkpoint | 🟡 Tie |
| Browser tab crash | May recover | Warning prevents | 🟢 Gates |
| User forgets | Protected | Must remember | 🟢 Auto-Save |

**Verdict**: Save Gates lose on "forgetful user" but win on clarity and control.

---

## 7. HYBRID OPTION: "SUGGESTED SAVES"

**Best of Both Worlds**:

Combine explicit save gates with **optional auto-save** at strategic points:

```typescript
// After AI description (if user doesn't manually save within 30 seconds)
useEffect(() => {
  if (form.description && form.description.length > 100 && !savedSections.includes(1)) {
    const timer = setTimeout(() => {
      // Subtle prompt: "Would you like to save your progress?"
      setShowSavePrompt(true);
    }, 30000); // 30 seconds
    
    return () => clearTimeout(timer);
  }
}, [form.description]);

// UI Component
{showSavePrompt && (
  <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
    <span>💾 Save your progress?</span>
    <button 
      onClick={() => { handleSaveAndContinue(1); setShowSavePrompt(false); }}
      className="bg-white text-blue-600 px-3 py-1 rounded font-semibold hover:bg-blue-50"
    >
      Save Now
    </button>
    <button 
      onClick={() => setShowSavePrompt(false)}
      className="text-blue-200 hover:text-white"
    >
      ✕
    </button>
  </div>
)}
```

**Benefits**:
- ✅ Reminder for forgetful users
- ✅ Still explicit (not silent)
- ✅ User can dismiss
- ✅ Non-intrusive (bottom corner)
- ✅ Only shows once (not spammy)

---

## 8. IMPLEMENTATION DECISION MATRIX

| Approach | Complexity | Duplicate Risk | User Control | Data Protection | Recommendation |
|----------|------------|----------------|--------------|-----------------|----------------|
| **Full Auto-Save** | 🔴 High | 🔴 High | 🔴 Low | 🟢 High | ❌ Not Recommended |
| **One-Time Auto-Save** | 🟡 Medium | 🟡 Medium | 🟡 Medium | 🟡 Medium | 🟡 Acceptable |
| **Pre-Submit Auto-Save** | 🟢 Low | 🟢 Low | 🟢 High | 🟡 Medium | ✅ Good |
| **Save Gates (Proposed)** | 🟢 Low | 🟢 Very Low | 🟢 High | 🟡 Medium | ✅ **BEST** |
| **Save Gates + Prompts** | 🟡 Medium | 🟢 Very Low | 🟢 High | 🟢 High | ✅ **OPTIMAL** |

---

## 9. FINAL RECOMMENDATION

### 9.1 Implement Save Gates with Optional Prompts

**Primary Pattern**: Progressive Save Gates
- Mandatory saves at 25%, 50%, 75%, 90% completion
- Sections unlock after saving previous section
- Visual feedback (checkmarks, locked icons, blur effect)

**Backup Safety Net**: Suggested Save Prompts
- Appears after 30 seconds of inactivity in a section
- Non-intrusive, dismissable
- Only shows once per section

**Emergency Recovery**: Optional Top Save Button
- "Save Draft" button always visible in header
- Allows saving incomplete section (with warnings)
- Last resort for paranoid users

### 9.2 Why This Is Better Than Original Auto-Save Proposal

**Simplicity**: 
- No debouncing, no timers, no change detection
- Just button clicks and section state

**Reliability**:
- Maximum 5 drafts per property (vs 20+ with auto-save)
- Predictable, testable behavior

**User Experience**:
- Clear, explicit, no magic
- Progress feels earned (unlock sections)
- Aligns with existing owner form pattern

**Risk**:
- 🟢 LOW (1.5/5) vs 🟡 MEDIUM (2.5/5) for auto-save
- Less code to break
- Easier to debug

**Cost**:
- Fewer API calls
- Less storage
- Lower maintenance

### 9.3 Implementation Steps

**Phase 1** (Week 1):
1. Day 1: Implement save gates in agent create-property
2. Day 2: Test thoroughly, fix issues
3. Day 3: Deploy to production, monitor

**Phase 2** (Week 2):
4. Day 1: Implement in landlord create-property
5. Day 2: Add optional save prompts
6. Day 3: Update owner form with draft integration

**Phase 3** (Week 3):
7. Day 1: Add emergency save button
8. Day 2: Polish UX (animations, messages)
9. Day 3: User testing, feedback gathering

**Total Timeline**: 2-3 weeks (vs 1-2 weeks for auto-save, but safer)

---

## 10. COMPARISON TO OTHER SENIOR DEVELOPER FEEDBACK

**If other senior developer recommended**:

### Auto-Save Approach:
- ✅ **Agree**: Data protection is important
- ⚠️ **Concern**: Duplicate risk still present
- 💡 **Alternative**: Save gates achieve same goal with less risk

### Manual Save Only:
- ✅ **Agree**: Simplest approach
- ⚠️ **Concern**: Users forget to save
- 💡 **Alternative**: Save gates force saves (best of both)

### Progressive Form Wizard:
- ✅ **Agree**: Best UX pattern
- ✅ **Evidence**: Owner form already uses this
- 💡 **Enhancement**: Add draft integration to existing pattern

---

## 11. QUESTIONS FOR PROJECT OWNER

Before implementation, please confirm:

1. **Section Breakdown**: Are the proposed save points (25%, 50%, 75%, 90%) acceptable, or would you prefer different intervals?

2. **Strictness**: Should sections be **strictly locked** (cannot access next until saved), or **soft locked** (warning but can proceed)?

3. **Edit Mode**: After saving a section, should it be:
   - Locked (readonly) with "Edit" button?
   - Still editable with "Save Changes" button?
   - Automatically save on edits?

4. **Visual Preference**: 
   - Blur future sections? Or just gray them out?
   - Lock icon? Or "Complete previous section" message?

5. **Mobile Behavior**: Same pattern on mobile, or simplified?

6. **Error Handling**: If save fails, should user:
   - Stay in section and retry?
   - Be allowed to proceed anyway (with warning)?

7. **Existing Drafts**: When loading a draft, should all saved sections be:
   - Unlocked (editable)?
   - Locked (readonly) until manually unlocked?

8. **Image Handling**: Should photo uploads trigger auto-save, or wait for "Save & Continue"?

---

## 12. TECHNICAL SPECIFICATIONS

### 12.1 Database Schema (No Changes Needed)

Existing `property_drafts` table already supports this:
- `draft_data` JSONB field stores all form data
- `updated_at` timestamp for "last saved" display
- `save_count` could track number of section saves (optional)

### 12.2 API Endpoints (No Changes Needed)

Existing `/api/properties/drafts` endpoints already handle:
- Create draft (first save)
- Update draft (subsequent saves)
- Load draft (when user returns)
- Delete draft (after successful submission)

### 12.3 State Management

New state variables needed:
```typescript
const [currentSection, setCurrentSection] = useState(1);
const [savedSections, setSavedSections] = useState<number[]>([]);
const [sectionErrors, setSectionErrors] = useState<Record<number, string>>({});
```

No changes to:
- Form data state (same as before)
- Image handling (same as before)
- Validation logic (same as before)

### 12.4 Backward Compatibility

**Existing Drafts**: Work seamlessly
- Load draft → All sections unlocked (since already saved)
- User can edit any section
- Save updates existing draft

**Existing Manual Save Button**: Can coexist
- "Save Draft" button (optional, anytime)
- "Save & Continue" buttons (required, per section)
- Both call same `saveDraft()` function

---

## Appendix: Code Snippets

### Snippet 1: Section Lock Component

```tsx
interface SectionLockOverlayProps {
  isLocked: boolean;
  sectionName: string;
}

const SectionLockOverlay: React.FC<SectionLockOverlayProps> = ({ isLocked, sectionName }) => {
  if (!isLocked) return null;
  
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg">
      <div className="text-center p-6">
        <div className="text-5xl mb-3">🔒</div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          {sectionName} Locked
        </h4>
        <p className="text-gray-600">
          Complete and save the previous section to unlock
        </p>
      </div>
    </div>
  );
};
```

### Snippet 2: Save & Continue Button

```tsx
interface SaveContinueButtonProps {
  sectionNum: number;
  nextSectionName: string;
  isSaving: boolean;
  onClick: () => void;
}

const SaveContinueButton: React.FC<SaveContinueButtonProps> = ({
  sectionNum,
  nextSectionName,
  isSaving,
  onClick
}) => (
  <div className="mt-6 flex justify-between items-center">
    <div className="text-sm text-gray-600">
      Section {sectionNum} of 5
    </div>
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSaving ? (
        <>
          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          Saving Progress...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save & Continue to {nextSectionName}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </>
      )}
    </button>
  </div>
);
```

### Snippet 3: Section Progress Indicator

```tsx
const SectionProgress: React.FC<{ currentSection: number; savedSections: number[]; }> = ({
  currentSection,
  savedSections
}) => {
  const sections = [
    'Basic Info',
    'Details',
    'Location',
    'Photos',
    'Additional'
  ];
  
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {sections.map((name, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center text-xs ${
              savedSections.includes(idx + 1) 
                ? 'text-green-600' 
                : currentSection === idx + 1 
                  ? 'text-blue-600' 
                  : 'text-gray-400'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
              savedSections.includes(idx + 1) 
                ? 'bg-green-100 border-2 border-green-600' 
                : currentSection === idx + 1 
                  ? 'bg-blue-100 border-2 border-blue-600' 
                  : 'bg-gray-100 border-2 border-gray-300'
            }`}>
              {savedSections.includes(idx + 1) ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              ) : currentSection === idx + 1 ? (
                <span className="font-bold">{idx + 1}</span>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </div>
            <span className="font-medium">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Status**: Ready for Owner Review & Decision  
**Recommendation**: ✅ **PROCEED WITH SAVE GATES APPROACH**
