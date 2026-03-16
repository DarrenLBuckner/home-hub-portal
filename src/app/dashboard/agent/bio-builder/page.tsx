'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/supabase';
import Link from 'next/link';

// ── Question Options (all tap-based, no typing required) ──

const MOTIVATION_OPTIONS = [
  'I love helping people find their dream home',
  'Family business — grew up in it',
  'I saw an opportunity in Guyana\'s growing market',
  'I\'m passionate about property and investment',
  'I transitioned from another career',
  'I want to help the diaspora invest back home',
  'I enjoy connecting people with the right property',
  'Other',
];

const PROPERTY_TYPE_OPTIONS = [
  'Residential homes',
  'Apartments & condos',
  'Land',
  'Commercial properties',
  'Luxury properties',
  'New builds & developments',
  'Rental properties',
  'Investment properties',
];

const NEIGHBORHOOD_OPTIONS = [
  'Georgetown',
  'East Coast Demerara (Lower)',
  'East Coast Demerara (Upper)',
  'East Bank Demerara (Lower)',
  'East Bank Demerara (Upper)',
  'West Bank Demerara',
  'West Coast Demerara',
  'Berbice',
  'Essequibo',
  'Linden',
  'Linden-Soesdyke Highway',
  'Outlying Areas',
];

const BUYER_TYPE_OPTIONS = [
  'Home buyers',
  'Property sellers',
  'Renters',
  'Landlords',
  'Investors',
  'Developers',
  'New construction / building clients',
];

const STRENGTH_OPTIONS = [
  'I know my neighborhoods inside and out',
  'Fast WhatsApp replies — I\'m always available',
  'I handle everything so the buyer doesn\'t stress',
  'I\'m fluent in multiple languages',
  'I have connections to lawyers, banks, and contractors',
  'I\'ve been in this area my whole life',
  'I focus on getting the best deal for my clients',
  'I\'m great with first-time buyers — patient and thorough',
  'I specialize in diaspora buyers and remote transactions',
  'I have strong negotiation skills',
  'I provide virtual tours and video walkthroughs',
  'Other — describe in your own words',
];

const LANGUAGE_OPTIONS = [
  'English',
  'Creolese',
  'Hindi',
  'Portuguese',
  'Spanish',
  'Chinese (Mandarin/Cantonese)',
  'Other',
];

const PERSONAL_TOUCH_OPTIONS = [
  'I treat every client like family',
  'I give honest advice even if it means losing a sale',
  'I stay in touch with clients long after the deal closes',
  'I go the extra mile — I\'ll meet you anywhere, anytime',
  'I make the process fun and stress-free',
  'I\'m data-driven — I bring market knowledge to every deal',
  'I believe in building long-term relationships, not quick sales',
  'Other — describe your style',
];

const LICENSED_OPTIONS = [
  'Yes — I am a licensed real estate agent',
  'Not yet — currently working toward my license',
];

const COMMUNITY_OPTIONS = [
  'Active in local community groups',
  'Volunteer work',
  'Involved in real estate associations',
  'Youth mentorship',
  'Church or religious community',
  'Business networking groups',
  'None — I prefer to let my work speak for itself',
];

// ── Step configuration with benefit-driven messaging ──

const STEPS = [
  {
    id: 'motivation',
    title: 'What drives you?',
    subtitle: 'Why did you get into real estate? Pick all that apply.',
    why: 'Buyers connect with agents who have a real reason for doing this work. Your "why" builds trust before you even speak to them.',
  },
  {
    id: 'propertyTypes',
    title: 'What do you specialize in?',
    subtitle: 'Pick the property types you work with most (up to 6).',
    why: 'When a buyer sees you specialize in exactly what they\'re looking for, you become their first call — not just another agent on the list.',
    maxSelections: 6,
  },
  {
    id: 'neighborhoods',
    title: 'Your areas',
    subtitle: 'Which regions do you cover? (up to 8)',
    why: 'Local knowledge is your biggest selling point. Diaspora buyers especially need someone who knows the ground — this shows you\'re that person.',
    maxSelections: 8,
  },
  {
    id: 'buyerTypes',
    title: 'Who you serve',
    subtitle: 'What types of clients do you work with? (up to 5)',
    why: 'A first-time buyer wants to see you work with first-time buyers. An investor wants to see you work with investors. This is how they find YOU.',
    maxSelections: 5,
  },
  {
    id: 'strengths',
    title: 'What sets you apart?',
    subtitle: 'What makes you different from other agents? (up to 6)',
    why: 'This is the part of your bio that turns a maybe into a WhatsApp message. Clients want to know what they\'re getting that they can\'t get elsewhere.',
    maxSelections: 6,
  },
  {
    id: 'licensed',
    title: 'Are you licensed?',
    subtitle: 'This sets you apart from other agents.',
    why: 'Clients feel more confident working with a licensed agent. If you have your license, this is a strong trust signal that belongs in your bio.',
    maxSelections: 1,
  },
  {
    id: 'languages',
    title: 'Languages',
    subtitle: 'What languages do you speak? (up to 6)',
    why: 'In Guyana\'s multicultural market, speaking a client\'s language — literally — can be the deciding factor.',
    maxSelections: 6,
  },
  {
    id: 'personalTouch',
    title: 'Your personal style',
    subtitle: 'How would you describe the way you work? (up to 6)',
    why: 'People don\'t just hire an agent — they hire a person. This tells them what it\'s actually like to work with you.',
    maxSelections: 6,
  },
  {
    id: 'community',
    title: 'Community',
    subtitle: 'Are you involved in the community? (up to 5)',
    why: 'Community involvement shows you\'re rooted and trusted locally. It\'s one more reason for a client to feel confident choosing you.',
    maxSelections: 5,
  },
  {
    id: 'extraNote',
    title: 'Anything else?',
    subtitle: 'Optional — add a short note if you want. Otherwise, skip straight to generating your bio!',
    why: 'If there\'s something special about you that wasn\'t covered — a certification, an award, a unique service — add it here.',
  },
];

type StepId = 'motivation' | 'propertyTypes' | 'neighborhoods' | 'buyerTypes' | 'strengths' | 'licensed' | 'languages' | 'personalTouch' | 'community' | 'extraNote';

const OPTIONS_MAP: Record<string, string[]> = {
  motivation: MOTIVATION_OPTIONS,
  propertyTypes: PROPERTY_TYPE_OPTIONS,
  neighborhoods: NEIGHBORHOOD_OPTIONS,
  buyerTypes: BUYER_TYPE_OPTIONS,
  strengths: STRENGTH_OPTIONS,
  licensed: LICENSED_OPTIONS,
  languages: LANGUAGE_OPTIONS,
  personalTouch: PERSONAL_TOUCH_OPTIONS,
  community: COMMUNITY_OPTIONS,
};

interface Answers {
  motivation: string[];
  motivation_other: string;
  propertyTypes: string[];
  neighborhoods: string[];
  buyerTypes: string[];
  strengths: string[];
  strengths_other: string;
  licensed: string[];
  languages: string[];
  personalTouch: string[];
  personal_touch_other: string;
  community: string[];
  extraNote: string;
}

export default function BioBuilderPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    motivation: [],
    motivation_other: '',
    propertyTypes: [],
    neighborhoods: [],
    buyerTypes: [],
    strengths: [],
    strengths_other: '',
    licensed: [],
    languages: [],
    personalTouch: [],
    personal_touch_other: '',
    community: [],
    extraNote: '',
  });
  const [agentName, setAgentName] = useState('');
  const [agentCompany, setAgentCompany] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number | null>(null);
  const [generatedBios, setGeneratedBios] = useState<string[]>([]);
  const [selectedBioIndex, setSelectedBioIndex] = useState<number | null>(null);
  const [editingBioIndex, setEditingBioIndex] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [existingBio, setExistingBio] = useState<string | null>(null);

  // Load agent data and check for existing bio
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, company, display_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        const name = profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        setAgentName(name);
        setAgentCompany(profile.company || '');
      }

      // Get vetting data (years experience, existing bio, existing questionnaire answers)
      const { data: vetting } = await supabase
        .from('agent_vetting' as any)
        .select('years_experience, bio, bio_questionnaire')
        .eq('user_id', user.id)
        .single();

      if (vetting) {
        const v = vetting as any;
        setYearsExperience(v.years_experience || null);
        setExistingBio(v.bio || null);

        // If they already completed the questionnaire, pre-fill answers and skip intro
        if (v.bio_questionnaire) {
          try {
            const prev = typeof v.bio_questionnaire === 'string'
              ? JSON.parse(v.bio_questionnaire)
              : v.bio_questionnaire;
            setAnswers(a => ({ ...a, ...prev }));
            setShowIntro(false);
          } catch {
            // ignore parse errors
          }
        }
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const step = STEPS[currentStep];
  const stepId = step.id as StepId;
  const isLastStep = currentStep === STEPS.length - 1;

  const maxSelections = step.maxSelections;

  const toggleOption = (option: string) => {
    if (stepId === 'extraNote') return;
    setAnswers(prev => {
      const current = prev[stepId] as string[];
      if (current.includes(option)) {
        return { ...prev, [stepId]: current.filter(o => o !== option) };
      }
      // Enforce selection cap
      if (maxSelections && current.length >= maxSelections) return prev;
      return { ...prev, [stepId]: [...current, option] };
    });
  };

  const totalSelected = Object.entries(answers)
    .filter(([key]) => key !== 'extraNote' && !key.endsWith('_other'))
    .reduce((sum, [, val]) => sum + (Array.isArray(val) ? val.length : 0), 0);

  // +1 for intro screen in progress calculation
  const progressPercent = Math.round((currentStep / STEPS.length) * 100);

  const handleGenerateBio = async () => {
    setGenerating(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // First save the questionnaire answers
      const saveRes = await fetch('/api/agents/bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ questionnaire_answers: answers }),
      });

      if (!saveRes.ok) {
        const saveErr = await saveRes.json();
        throw new Error(saveErr.error || 'Failed to save answers');
      }

      // Now generate the bio
      const res = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          company: agentCompany,
          yearsExperience,
          motivation: answers.motivation,
          motivation_other: answers.motivation_other || undefined,
          propertyTypes: answers.propertyTypes,
          neighborhoods: answers.neighborhoods,
          buyerTypes: answers.buyerTypes,
          strengths: answers.strengths,
          strengths_other: answers.strengths_other || undefined,
          languages: answers.languages,
          personalTouch: answers.personalTouch,
          personal_touch_other: answers.personal_touch_other || undefined,
          communityInvolvement: answers.community,
          additionalNote: answers.extraNote || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate bio');
      }

      const data = await res.json();
      setGeneratedBios(data.bios);
      setSelectedBioIndex(0);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    }

    setGenerating(false);
  };

  const handleSaveBio = async () => {
    if (selectedBioIndex === null || !generatedBios[selectedBioIndex]) return;

    setSaving(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/agents/bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          questionnaire_answers: answers,
          generated_bio: generatedBios[selectedBioIndex],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save bio');
      }

      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Bio Builder...</p>
      </main>
    );
  }

  // ── Success screen ──
  if (saved) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">&#10003;</div>
          <h1 className="text-3xl font-bold text-green-700 mb-3">Your Bio Is Live!</h1>
          <p className="text-gray-600 mb-2">
            Your professional bio is now visible on your public agent profile.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Every client who visits your profile on Guyana HomeHub will now see a polished, professional bio that builds trust and shows them exactly why they should work with you.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-amber-800 text-sm">
              Now make sure your profile photo is a professional headshot and your contact details are up to date — clients will see these alongside your bio.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Your Bio</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {generatedBios[selectedBioIndex!]}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/agent/settings"
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Complete My Profile
            </Link>
            <Link
              href="/dashboard/agent"
              className="px-5 py-2.5 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Bio selection screen ──
  if (generatedBios.length > 0) {
    return (
      <main className="max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/dashboard/agent" className="text-green-600 hover:underline text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Pick Your Bio</h1>
          <p className="text-gray-600 mb-2">
            We wrote 3 versions based on your answers. Tap the one that sounds most like you, then save it.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            This is what clients will see on your public profile — the first impression that decides whether they reach out or keep scrolling.
          </p>

          <div className="space-y-4 mb-6">
            {generatedBios.map((bio, index) => (
              <div
                key={index}
                onClick={() => { if (editingBioIndex !== index) setSelectedBioIndex(index); }}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
                  selectedBioIndex === index
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    selectedBioIndex === index ? 'text-green-700' : 'text-gray-400'
                  }`}>
                    Option {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedBioIndex === index && (
                      <span className="text-green-600 text-sm font-medium">Selected</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBioIndex(index);
                        setEditingBioIndex(editingBioIndex === index ? null : index);
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                    >
                      {editingBioIndex === index ? 'Done' : 'Edit'}
                    </button>
                  </div>
                </div>
                {editingBioIndex === index ? (
                  <textarea
                    value={bio}
                    onChange={(e) => {
                      const updated = [...generatedBios];
                      updated[index] = e.target.value;
                      setGeneratedBios(updated);
                    }}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-y text-gray-700 text-sm sm:text-base leading-relaxed"
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                    {bio}
                  </p>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSaveBio}
              disabled={selectedBioIndex === null || saving}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save This Bio'}
            </button>
            <button
              onClick={handleGenerateBio}
              disabled={generating}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
            >
              {generating ? 'Regenerating...' : 'Try Again'}
            </button>
            <button
              onClick={() => {
                setGeneratedBios([]);
                setSelectedBioIndex(null);
              }}
              className="px-6 py-3 text-gray-500 hover:text-gray-700 transition text-sm"
            >
              Edit Answers
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Intro screen (the "why") ──
  if (showIntro) {
    return (
      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/dashboard/agent" className="text-green-600 hover:underline text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 sm:p-10 text-center text-white">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Let&apos;s Build Your Professional Bio
            </h1>
            <p className="text-emerald-100 text-lg max-w-md mx-auto">
              The agents who get the most clients are the ones buyers trust before they ever make a call.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* What this does */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Here&apos;s what we&apos;re doing and why</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We&apos;re building you a professional bio that goes on your public profile — the page buyers see when they find you on Guyana HomeHub. Right now, clients who visit your profile see your name, your listings, and not much else. That&apos;s a missed opportunity.
              </p>
              <p className="text-gray-600 leading-relaxed">
                A strong bio tells your story, shows your expertise, and gives buyers a reason to choose <strong>you</strong> over every other agent on the platform. We&apos;re going to build that for you — all you have to do is tap a few answers.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">&#128200;</div>
                <h3 className="font-bold text-emerald-800 text-sm mb-1">More Profile Views</h3>
                <p className="text-emerald-700 text-xs">Agents with bios rank higher and get seen more by buyers searching the platform.</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">&#128172;</div>
                <h3 className="font-bold text-emerald-800 text-sm mb-1">More Inquiries</h3>
                <p className="text-emerald-700 text-xs">Buyers are far more likely to send a WhatsApp message when they can see who they&apos;re contacting.</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">&#129309;</div>
                <h3 className="font-bold text-emerald-800 text-sm mb-1">Stronger Trust</h3>
                <p className="text-emerald-700 text-xs">Especially for diaspora buyers — they need to trust an agent before sending money from abroad.</p>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-gray-50 rounded-xl p-5 mb-8">
              <h3 className="font-bold text-gray-800 mb-3">How it works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <p className="text-gray-600 text-sm"><strong>Tap your answers</strong> — 9 quick screens, all multiple choice. No typing. Under 2 minutes.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <p className="text-gray-600 text-sm"><strong>AI writes your bio</strong> — We generate 3 professional versions. You pick the one you like.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <p className="text-gray-600 text-sm"><strong>It goes live instantly</strong> — Your bio appears on your public profile right away. Clients see it immediately.</p>
                </div>
              </div>
            </div>

            {/* Existing bio notice */}
            {existingBio && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-blue-800 text-sm font-medium mb-1">You already have a bio</p>
                <p className="text-blue-700 text-sm">
                  No problem — completing this will generate an upgraded version based on your new answers. You can always keep what you have by going back.
                </p>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => setShowIntro(false)}
              className="w-full px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg"
            >
              Let&apos;s Get Started
            </button>
            <p className="text-center text-gray-400 text-xs mt-3">
              Takes under 2 minutes. No typing required.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Questionnaire flow ──
  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard/agent" className="text-green-600 hover:underline text-sm">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Progress bar */}
        <div className="bg-gray-100 h-2">
          <div
            className="bg-green-500 h-2 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400 font-medium">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-green-600 font-medium">
              {totalSelected} selected
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{step.title}</h2>
          <p className="text-gray-500 mb-3">{step.subtitle}</p>

          {/* Benefit context — why this question matters */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            <p className="text-amber-800 text-sm leading-relaxed">
              <span className="font-semibold">Why this matters: </span>
              {step.why}
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="px-6 sm:px-8 pb-6">
          {stepId === 'extraNote' ? (
            <div>
              <textarea
                value={answers.extraNote}
                onChange={(e) => setAnswers(prev => ({ ...prev, extraNote: e.target.value }))}
                placeholder="e.g., I also do property management... (completely optional)"
                maxLength={200}
                rows={3}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-gray-700"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {answers.extraNote.length}/200
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {OPTIONS_MAP[stepId]?.map((option) => {
                const selected = (answers[stepId] as string[]).includes(option);
                const currentCount = (answers[stepId] as string[]).length;
                const atLimit = maxSelections ? currentCount >= maxSelections : false;
                const disabled = !selected && atLimit;
                return (
                  <button
                    key={option}
                    onClick={() => toggleOption(option)}
                    disabled={disabled}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all text-sm sm:text-base ${
                      selected
                        ? 'border-green-500 bg-green-50 text-green-800 font-medium'
                        : disabled
                        ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                        selected ? 'border-green-500 bg-green-500' : disabled ? 'border-gray-200' : 'border-gray-300'
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {option}
                    </span>
                  </button>
                );
              })}
              {/* "Other" free text fields */}
              {stepId === 'motivation' && (answers.motivation as string[]).includes('Other') && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={answers.motivation_other}
                    onChange={(e) => setAnswers(prev => ({ ...prev, motivation_other: e.target.value }))}
                    placeholder="Tell us what drives you..."
                    maxLength={150}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{answers.motivation_other.length}/150</p>
                </div>
              )}
              {stepId === 'strengths' && (answers.strengths as string[]).includes('Other — describe in your own words') && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={answers.strengths_other}
                    onChange={(e) => setAnswers(prev => ({ ...prev, strengths_other: e.target.value }))}
                    placeholder="What sets you apart?"
                    maxLength={200}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{answers.strengths_other.length}/200</p>
                </div>
              )}
              {stepId === 'personalTouch' && (answers.personalTouch as string[]).includes('Other — describe your style') && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={answers.personal_touch_other}
                    onChange={(e) => setAnswers(prev => ({ ...prev, personal_touch_other: e.target.value }))}
                    placeholder="Describe your personal style..."
                    maxLength={150}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{answers.personal_touch_other.length}/150</p>
                </div>
              )}
              {maxSelections && (answers[stepId] as string[]).length >= maxSelections && (
                <p className="text-sm text-amber-600 text-center mt-2">Maximum {maxSelections} selected — deselect one to change.</p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 sm:mx-8 mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="px-6 sm:px-8 pb-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep === 0) {
                setShowIntro(true);
              } else {
                setCurrentStep(s => s - 1);
              }
            }}
            className="px-5 py-2.5 text-gray-600 font-medium hover:text-gray-900 transition"
          >
            Back
          </button>

          {isLastStep ? (
            <button
              onClick={handleGenerateBio}
              disabled={generating || totalSelected < 3}
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Generating...
                </span>
              ) : (
                'Generate My Bio'
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(s => s + 1)}
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition shadow-lg"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Encouragement below card */}
      {currentStep < STEPS.length - 1 && (
        <p className="text-center text-xs text-gray-400 mt-4">
          Don&apos;t see a perfect fit? Just pick the closest ones — the AI will make it sound natural.
        </p>
      )}
      {currentStep === STEPS.length - 1 && totalSelected >= 3 && (
        <p className="text-center text-sm text-emerald-600 font-medium mt-4">
          You&apos;ve selected {totalSelected} items — that&apos;s plenty for a great bio. Hit generate!
        </p>
      )}
      {currentStep === STEPS.length - 1 && totalSelected < 3 && (
        <p className="text-center text-sm text-amber-600 mt-4">
          Go back and select at least 3 items across any steps so we have enough to work with.
        </p>
      )}
    </main>
  );
}
