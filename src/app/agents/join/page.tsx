'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';

// ── Constants ──────────────────────────────────────────────

const LANGUAGES = ['English', 'Hindi', 'Creolese', 'Portuguese', 'Spanish', 'Other'];

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Land', 'Luxury', 'New Builds'];

const TRANSACTION_OPTIONS = ['Buyers', 'Sellers', 'Both'];

const REGIONS = [
  { display: 'Georgetown', code: 'GY-Georgetown' },
  { display: 'East Bank Demerara', code: 'GY-R4' },
  { display: 'West Demerara/Essequibo', code: 'GY-R3' },
  { display: 'East Berbice-Corentyne', code: 'GY-R6' },
  { display: 'Pomeroon-Supenaam', code: 'GY-R2' },
  { display: 'Other', code: 'Other' },
];

const BUYER_TYPES = [
  'Guyanese diaspora buyers living abroad',
  'International expats and investors',
  'Local first-time buyers',
  'Property investors',
  'Corporate and relocation buyers',
];

const DIASPORA_CITIES = ['New York', 'Toronto', 'London', 'South Florida', 'Montreal', 'Other'];

const STEP_TITLES = ['About You', 'Specialization', 'Who You Serve', 'Track Record', 'Contact'];

// ── Types ──────────────────────────────────────────────────

interface AgentFormData {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  license_number: string;
  years_active: number | null;
  brokerage_name: string;
  is_independent: boolean;
  languages: string[];
  headshot_url: string;
  property_types: string[];
  transaction_types: string[];
  primary_regions: string[];
  primary_neighborhoods: string[];
  price_range_min_usd: number | null;
  price_range_max_usd: number | null;
  niche_expertise: string;
  buyer_types: string[];
  diaspora_cities: string[];
  community_ties: string;
  total_transactions: number | null;
  transactions_12mo: number | null;
  avg_days_to_close: number | null;
  notable_neighborhoods: string[];
  certifications: string[];
  awards: string;
  notable_transactions: string;
  phone: string;
  whatsapp: string;
  preferred_contact: string;
}

const EMPTY_FORM: AgentFormData = {
  id: '',
  email: '',
  full_name: '',
  display_name: '',
  license_number: '',
  years_active: null,
  brokerage_name: '',
  is_independent: true,
  languages: [],
  headshot_url: '',
  property_types: [],
  transaction_types: [],
  primary_regions: [],
  primary_neighborhoods: [],
  price_range_min_usd: null,
  price_range_max_usd: null,
  niche_expertise: '',
  buyer_types: [],
  diaspora_cities: [],
  community_ties: '',
  total_transactions: null,
  transactions_12mo: null,
  avg_days_to_close: null,
  notable_neighborhoods: [],
  certifications: [],
  awards: '',
  notable_transactions: '',
  phone: '',
  whatsapp: '',
  preferred_contact: '',
};

// ── Completeness Scoring ───────────────────────────────────

function calculateCompleteness(data: AgentFormData): number {
  let score = 0;

  // Identity: 20pts (full_name: 5, years_active: 5, languages: 5, headshot_url: 5)
  if (data.full_name.trim()) score += 5;
  if (data.years_active && data.years_active > 0) score += 5;
  if (data.languages.length > 0) score += 5;
  if (data.headshot_url) score += 5;

  // Specialization: 25pts (property_types: 7, primary_regions: 7, price_range_min: 5, price_range_max: 6)
  if (data.property_types.length > 0) score += 7;
  if (data.primary_regions.length > 0) score += 7;
  if (data.price_range_min_usd !== null && data.price_range_min_usd >= 0) score += 5;
  if (data.price_range_max_usd !== null && data.price_range_max_usd > 0) score += 6;

  // Buyer persona: 20pts
  const hasDiaspora = data.buyer_types.includes('Guyanese diaspora buyers living abroad');
  if (hasDiaspora) {
    if (data.buyer_types.length > 0) score += 10;
    if (data.diaspora_cities.length > 0) score += 10;
  } else {
    if (data.buyer_types.length > 0) score += 20;
  }

  // Track record: 25pts (total_transactions: 9, transactions_12mo: 8, notable_neighborhoods: 8)
  if (data.total_transactions !== null && data.total_transactions > 0) score += 9;
  if (data.transactions_12mo !== null && data.transactions_12mo > 0) score += 8;
  if (data.notable_neighborhoods.length > 0) score += 8;

  // Contact: 10pts (at least one of phone/email/whatsapp)
  if (data.phone.trim() || data.email.trim() || data.whatsapp.trim()) score += 10;

  return score;
}

// ── DB helpers ─────────────────────────────────────────────

function dbToForm(record: Record<string, unknown>): AgentFormData {
  return {
    id: (record.id as string) || '',
    email: (record.email as string) || '',
    full_name: (record.full_name as string) || '',
    display_name: (record.display_name as string) || '',
    license_number: (record.license_number as string) || '',
    years_active: (record.years_active as number) ?? null,
    brokerage_name: (record.brokerage_name as string) || '',
    is_independent: record.is_independent !== false,
    languages: (record.languages as string[]) || [],
    headshot_url: (record.headshot_url as string) || '',
    property_types: (record.property_types as string[]) || [],
    transaction_types: (record.transaction_types as string[]) || [],
    primary_regions: (record.primary_regions as string[]) || [],
    primary_neighborhoods: (record.primary_neighborhoods as string[]) || [],
    price_range_min_usd: (record.price_range_min_usd as number) ?? null,
    price_range_max_usd: (record.price_range_max_usd as number) ?? null,
    niche_expertise: (record.niche_expertise as string) || '',
    buyer_types: (record.buyer_types as string[]) || [],
    diaspora_cities: (record.diaspora_cities as string[]) || [],
    community_ties: (record.community_ties as string) || '',
    total_transactions: (record.total_transactions as number) ?? null,
    transactions_12mo: (record.transactions_12mo as number) ?? null,
    avg_days_to_close: (record.avg_days_to_close as number) ?? null,
    notable_neighborhoods: (record.notable_neighborhoods as string[]) || [],
    certifications: (record.certifications as string[]) || [],
    awards: (record.awards as string) || '',
    notable_transactions: (record.notable_transactions as string) || '',
    phone: (record.phone as string) || '',
    whatsapp: (record.whatsapp as string) || '',
    preferred_contact: (record.preferred_contact as string) || '',
  };
}

// ── Tag Input Component ────────────────────────────────────

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  function handleAdd() {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="text-blue-400 hover:text-blue-700 font-bold"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Checkbox Group ─────────────────────────────────────────

function CheckboxGroup({
  options,
  selected,
  onChange,
  columns = 2,
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  columns?: number;
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
            selected.includes(opt.value)
              ? 'bg-blue-50 border-blue-300 text-blue-800'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────

function ProgressBar({ currentStep, completeness }: { currentStep: number; completeness: number }) {
  return (
    <div className="mb-8">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-3">
        {STEP_TITLES.map((title, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          return (
            <div key={title} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div
                    className={`flex-1 h-0.5 ${isCompleted || isActive ? 'bg-blue-500' : 'bg-gray-200'}`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? '\u2713' : stepNum}
                </div>
                {i < STEP_TITLES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`}
                  />
                )}
              </div>
              <span
                className={`text-xs mt-1.5 text-center hidden sm:block ${
                  isActive ? 'text-blue-700 font-semibold' : 'text-gray-500'
                }`}
              >
                {title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Completeness bar */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              completeness >= 70 ? 'bg-green-500' : completeness >= 40 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
          {completeness}% complete
        </span>
      </div>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────

export default function AgentJoinPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow state
  const [screen, setScreen] = useState<'email' | 'form'>('email');
  const [currentStep, setCurrentStep] = useState(1);

  // Email entry
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Form data
  const [formData, setFormData] = useState<AgentFormData>({ ...EMPTY_FORM });
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Email lookup / create ──────────────────────────────

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailLoading(true);
    try {
      // Check for existing agent record
      const { data: existing, error: lookupError } = await supabase
        .from('agents')
        .select('*')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existing) {
        // Restore draft
        const restored = dbToForm(existing);
        setFormData(restored);

        // Use agents.headshot_url if present, otherwise fall back to profiles.profile_image
        if (restored.headshot_url) {
          setHeadshotPreview(restored.headshot_url);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('profile_image')
            .eq('email', trimmedEmail)
            .maybeSingle();

          if (profile?.profile_image) {
            setHeadshotPreview(profile.profile_image);
            restored.headshot_url = profile.profile_image;
            setFormData(restored);
          }
        }

        setSaveMessage('Draft restored! Pick up where you left off.');
      } else {
        // Create new agent record
        const { data: created, error: createError } = await supabase
          .from('agents')
          .insert({ email: trimmedEmail })
          .select('*')
          .single();

        if (createError) throw createError;

        setFormData({ ...EMPTY_FORM, id: created.id, email: trimmedEmail });
        setSaveMessage('');
      }

      setScreen('form');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setEmailError(message);
    } finally {
      setEmailLoading(false);
    }
  }

  // ── Headshot upload ────────────────────────────────────

  async function uploadHeadshot(): Promise<string | null> {
    if (!headshotFile) return formData.headshot_url || null;

    const ext = headshotFile.name.split('.').pop() || 'jpg';
    const fileName = `${formData.id}/${Date.now()}.${ext}`;

    // Upload to existing 'User Avatars' bucket (single source of truth)
    const { data, error } = await supabase.storage
      .from('User Avatars')
      .upload(fileName, headshotFile, { cacheControl: '3600', upsert: true });

    if (error) throw new Error(`Headshot upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from('User Avatars')
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Sync to profiles.profile_image (master record) matched by email
    await supabase
      .from('profiles')
      .update({ profile_image: publicUrl })
      .eq('email', formData.email);

    return publicUrl;
  }

  // ── Save draft ─────────────────────────────────────────

  async function saveDraft(data: AgentFormData, showMessage = true) {
    setSaving(true);
    setSaveMessage('');
    try {
      const completeness = calculateCompleteness(data);
      const { error } = await supabase
        .from('agents')
        .update({
          full_name: data.full_name || null,
          display_name: data.display_name || null,
          license_number: data.license_number || null,
          years_active: data.years_active,
          brokerage_name: data.brokerage_name || null,
          is_independent: data.is_independent,
          languages: data.languages.length > 0 ? data.languages : null,
          headshot_url: data.headshot_url || null,
          property_types: data.property_types.length > 0 ? data.property_types : null,
          transaction_types: data.transaction_types.length > 0 ? data.transaction_types : null,
          primary_regions: data.primary_regions.length > 0 ? data.primary_regions : null,
          primary_neighborhoods: data.primary_neighborhoods.length > 0 ? data.primary_neighborhoods : null,
          price_range_min_usd: data.price_range_min_usd,
          price_range_max_usd: data.price_range_max_usd,
          niche_expertise: data.niche_expertise || null,
          buyer_types: data.buyer_types.length > 0 ? data.buyer_types : null,
          diaspora_cities: data.diaspora_cities.length > 0 ? data.diaspora_cities : null,
          community_ties: data.community_ties || null,
          total_transactions: data.total_transactions,
          transactions_12mo: data.transactions_12mo,
          avg_days_to_close: data.avg_days_to_close,
          notable_neighborhoods: data.notable_neighborhoods.length > 0 ? data.notable_neighborhoods : null,
          certifications: data.certifications.length > 0 ? data.certifications : null,
          awards: data.awards || null,
          notable_transactions: data.notable_transactions || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          preferred_contact: data.preferred_contact || null,
          profile_completeness: completeness,
        })
        .eq('id', data.id);

      if (error) throw error;

      if (showMessage) {
        setSaveMessage('Draft saved.');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save.';
      setSaveMessage(`Error: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Step validation ────────────────────────────────────

  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required.';
      if (!formData.years_active || formData.years_active < 0) newErrors.years_active = 'Years active is required.';
      if (!formData.headshot_url && !headshotFile) newErrors.headshot = 'Please upload a headshot photo.';
    }

    if (step === 5) {
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required.';
      if (!formData.email.trim()) newErrors.email = 'Email is required.';
      if (!formData.preferred_contact) newErrors.preferred_contact = 'Please select a preferred contact method.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Navigation ─────────────────────────────────────────

  async function handleNext() {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      let updatedData = { ...formData };

      // Upload headshot on step 1 if a new file is selected
      if (currentStep === 1 && headshotFile) {
        const url = await uploadHeadshot();
        if (url) {
          updatedData = { ...updatedData, headshot_url: url };
          setFormData(updatedData);
          setHeadshotFile(null);
        }
      }

      await saveDraft(updatedData, false);
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      setSaveMessage('Section saved.');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save section.';
      setSaveMessage(`Error: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  // ── Final submit ───────────────────────────────────────

  async function handleSubmit() {
    if (!validateStep(5)) return;

    const completeness = calculateCompleteness(formData);

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          phone: formData.phone || null,
          whatsapp: formData.whatsapp || null,
          preferred_contact: formData.preferred_contact || null,
          is_published: false,
          joined_at: new Date().toISOString(),
          profile_completeness: completeness,
        })
        .eq('id', formData.id);

      if (error) throw error;

      router.push('/agents/thank-you');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed.';
      setSaveMessage(`Error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Update helper ──────────────────────────────────────

  function updateField<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // ── Render: Email Screen ───────────────────────────────

  if (screen === 'email') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Join Our Agent Network</h1>
            <p className="text-gray-600">Build your profile and connect with buyers worldwide.</p>
          </div>

          {/* Green callout */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <p className="text-green-800 text-sm leading-relaxed">
              Your profile is how diaspora buyers in New York, Toronto, and London find and choose you.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <form onSubmit={handleEmailSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                autoFocus
              />
              {emailError && (
                <p className="text-red-600 text-sm mt-2">{emailError}</p>
              )}

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {emailLoading ? 'Checking...' : 'Get Started'}
              </button>
            </form>

            <p className="text-gray-400 text-xs mt-4 text-center">
              Takes about 10 minutes. Save and come back anytime.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Form ───────────────────────────────────────

  const completeness = calculateCompleteness(formData);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agent Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            {formData.email}
          </p>
        </div>

        {/* Save message */}
        {saveMessage && (
          <div
            className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
              saveMessage.startsWith('Error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {saveMessage}
          </div>
        )}

        <ProgressBar currentStep={currentStep} completeness={completeness} />

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {/* ── STEP 1: About You ──────────────────────── */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">About You</h2>
              <p className="text-sm text-gray-500 mb-6">Required to submit your profile.</p>

              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    placeholder="Your full legal name"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.full_name ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.full_name && <p className="text-red-600 text-xs mt-1">{errors.full_name}</p>}
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => updateField('display_name', e.target.value)}
                    placeholder="How buyers will see your name"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* License Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License number</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => updateField('license_number', e.target.value)}
                    placeholder="Professional license or registration number"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Years Active */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years active <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.years_active ?? ''}
                    onChange={(e) => updateField('years_active', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="How many years in real estate"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.years_active ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.years_active && <p className="text-red-600 text-xs mt-1">{errors.years_active}</p>}
                </div>

                {/* Work Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work type</label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        updateField('is_independent', true);
                        updateField('brokerage_name', '');
                      }}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                        formData.is_independent
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Independent
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('is_independent', false)}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-gray-300 ${
                        !formData.is_independent
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Brokerage
                    </button>
                  </div>
                </div>

                {/* Brokerage Name (conditional) */}
                {!formData.is_independent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brokerage name</label>
                    <input
                      type="text"
                      value={formData.brokerage_name}
                      onChange={(e) => updateField('brokerage_name', e.target.value)}
                      placeholder="Your brokerage or agency name"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                  <CheckboxGroup
                    options={LANGUAGES.map((l) => ({ label: l, value: l }))}
                    selected={formData.languages}
                    onChange={(values) => updateField('languages', values)}
                    columns={3}
                  />
                </div>

                {/* Headshot */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headshot photo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    {(headshotPreview || formData.headshot_url) && (
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
                        <img
                          src={headshotPreview || formData.headshot_url}
                          alt="Headshot preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setHeadshotFile(file);
                            setHeadshotPreview(URL.createObjectURL(file));
                            if (errors.headshot) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.headshot;
                                return next;
                              });
                            }
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {headshotPreview || formData.headshot_url ? 'Change photo' : 'Upload photo'}
                      </button>
                      <p className="text-xs text-gray-400 mt-1">
                        Professional photo recommended. JPG or PNG.
                      </p>
                      {errors.headshot && <p className="text-red-600 text-xs mt-1">{errors.headshot}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-6 border-t border-gray-100 pt-4">
                All information can be updated later from your agent dashboard settings.
              </p>
            </div>
          )}

          {/* ── STEP 2: Specialization ─────────────────── */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Specialization</h2>
              <p className="text-sm text-gray-500 mb-6">Required for your profile to be published.</p>

              <div className="space-y-5">
                {/* Property Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property types</label>
                  <CheckboxGroup
                    options={PROPERTY_TYPES.map((t) => ({ label: t, value: t }))}
                    selected={formData.property_types}
                    onChange={(values) => updateField('property_types', values)}
                    columns={3}
                  />
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction type</label>
                  <div className="flex gap-3">
                    {TRANSACTION_OPTIONS.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                          formData.transaction_types.includes(opt)
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="transaction_type"
                          value={opt}
                          checked={formData.transaction_types.includes(opt)}
                          onChange={() => updateField('transaction_types', [opt])}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Regions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary regions</label>
                  <CheckboxGroup
                    options={REGIONS.map((r) => ({ label: r.display, value: r.code }))}
                    selected={formData.primary_regions}
                    onChange={(values) => updateField('primary_regions', values)}
                  />
                </div>

                {/* Neighborhoods */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhoods</label>
                  <p className="text-xs text-gray-400 mb-2">Add the neighborhoods you work in most.</p>
                  <TagInput
                    tags={formData.primary_neighborhoods}
                    onAdd={(tag) => updateField('primary_neighborhoods', [...formData.primary_neighborhoods, tag])}
                    onRemove={(tag) =>
                      updateField('primary_neighborhoods', formData.primary_neighborhoods.filter((t) => t !== tag))
                    }
                    placeholder="e.g. Bel Air Park"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price range (USD)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        min="0"
                        value={formData.price_range_min_usd ?? ''}
                        onChange={(e) =>
                          updateField('price_range_min_usd', e.target.value ? parseInt(e.target.value) : null)
                        }
                        placeholder="Min"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        value={formData.price_range_max_usd ?? ''}
                        onChange={(e) =>
                          updateField('price_range_max_usd', e.target.value ? parseInt(e.target.value) : null)
                        }
                        placeholder="Max"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Niche Expertise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niche expertise <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={formData.niche_expertise}
                    onChange={(e) => updateField('niche_expertise', e.target.value)}
                    placeholder="e.g. Waterfront properties, Heritage homes, New development pre-sales"
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Who You Serve ──────────────────── */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Who You Serve</h2>
              <p className="text-sm text-gray-500 mb-6">Help buyers understand if you are the right fit.</p>

              <div className="space-y-5">
                {/* Buyer Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buyer types</label>
                  <CheckboxGroup
                    options={BUYER_TYPES.map((b) => ({ label: b, value: b }))}
                    selected={formData.buyer_types}
                    onChange={(values) => {
                      updateField('buyer_types', values);
                      // Clear diaspora cities if diaspora deselected
                      if (!values.includes('Guyanese diaspora buyers living abroad')) {
                        updateField('diaspora_cities', []);
                      }
                    }}
                    columns={1}
                  />
                </div>

                {/* Diaspora Cities (conditional) */}
                {formData.buyer_types.includes('Guyanese diaspora buyers living abroad') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Which diaspora cities do your clients come from?
                    </label>
                    <CheckboxGroup
                      options={DIASPORA_CITIES.map((c) => ({ label: c, value: c }))}
                      selected={formData.diaspora_cities}
                      onChange={(values) => updateField('diaspora_cities', values)}
                      columns={3}
                    />
                  </div>
                )}

                {/* Community Ties */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community ties <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={formData.community_ties}
                    onChange={(e) => updateField('community_ties', e.target.value)}
                    placeholder="e.g. Active member of the Georgetown Chamber of Commerce, volunteer with Habitat for Humanity Guyana"
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Track Record ───────────────────── */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Track Record</h2>
              <p className="text-sm text-gray-500 mb-6">Show buyers your experience and credentials.</p>

              <div className="space-y-5">
                {/* Total Transactions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total transactions</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.total_transactions ?? ''}
                    onChange={(e) =>
                      updateField('total_transactions', e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="Total deals closed in your career"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Last 12 months */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transactions in last 12 months</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.transactions_12mo ?? ''}
                    onChange={(e) =>
                      updateField('transactions_12mo', e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="Deals closed in the past year"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Avg Days to Close */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avg. days to close <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.avg_days_to_close ?? ''}
                    onChange={(e) =>
                      updateField('avg_days_to_close', e.target.value ? parseInt(e.target.value) : null)
                    }
                    placeholder="Average time from listing to close"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notable Neighborhoods */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notable neighborhoods</label>
                  <p className="text-xs text-gray-400 mb-2">Neighborhoods where you have closed deals.</p>
                  <TagInput
                    tags={formData.notable_neighborhoods}
                    onAdd={(tag) =>
                      updateField('notable_neighborhoods', [...formData.notable_neighborhoods, tag])
                    }
                    onRemove={(tag) =>
                      updateField('notable_neighborhoods', formData.notable_neighborhoods.filter((t) => t !== tag))
                    }
                    placeholder="e.g. Kitty"
                  />
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                  <TagInput
                    tags={formData.certifications}
                    onAdd={(tag) => updateField('certifications', [...formData.certifications, tag])}
                    onRemove={(tag) =>
                      updateField('certifications', formData.certifications.filter((t) => t !== tag))
                    }
                    placeholder="e.g. Licensed Real Estate Agent"
                  />
                </div>

                {/* Awards */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Awards <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={formData.awards}
                    onChange={(e) => updateField('awards', e.target.value)}
                    placeholder="Any awards or recognitions"
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Proud Of */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proud of <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={formData.notable_transactions}
                    onChange={(e) => updateField('notable_transactions', e.target.value)}
                    placeholder="Notable deals, achievements, or milestones you are proud of"
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Contact ────────────────────────── */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Information</h2>
              <p className="text-sm text-gray-500 mb-6">Required. How buyers will reach you.</p>

              <div className="space-y-5">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+592-000-0000"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                </div>

                {/* Email (pre-filled, read-only display) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    placeholder="+592-000-0000"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Preferred Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred contact <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {['Phone', 'Email', 'WhatsApp'].map((method) => (
                      <label
                        key={method}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                          formData.preferred_contact === method
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="preferred_contact"
                          value={method}
                          checked={formData.preferred_contact === method}
                          onChange={() => updateField('preferred_contact', method)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{method}</span>
                      </label>
                    ))}
                  </div>
                  {errors.preferred_contact && (
                    <p className="text-red-600 text-xs mt-1">{errors.preferred_contact}</p>
                  )}
                </div>

                {/* Completeness warning */}
                {completeness < 70 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      Your profile is {completeness}% complete. Profiles need at least 70% to be eligible for publishing.
                      You can still submit now and complete the remaining sections later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ─────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {saving && (
                <span className="text-sm text-gray-400">Saving...</span>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
