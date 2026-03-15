'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import Link from 'next/link';

const BANNER_MESSAGES = [
  {
    headline: 'Agents with a bio get up to 3x more inquiries',
    body: 'Buyers want to know who they\'re trusting with the biggest purchase of their life. A professional bio builds that trust before they even pick up the phone.',
  },
  {
    headline: 'Your profile is incomplete — clients notice',
    body: 'When a buyer compares two agents and one has a professional bio while the other has a blank page, who do you think they\'re calling? Stand out in under 2 minutes.',
  },
  {
    headline: 'Diaspora buyers research agents before they call',
    body: 'Guyanese living abroad do their homework online before choosing an agent back home. A strong bio gives them the confidence to reach out to you first.',
  },
];

export default function BioCompletionBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    async function checkBio() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if agent has a bio
      const { data: vetting } = await supabase
        .from('agent_vetting' as any)
        .select('bio')
        .eq('user_id', user.id)
        .single();

      // Show banner if no bio exists
      if (!vetting || !(vetting as any).bio) {
        // Rotate messages based on day so they see fresh copy each visit
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        setMessageIndex(dayOfYear % BANNER_MESSAGES.length);
        setShow(true);
      }
    }
    checkBio();
  }, []);

  if (!show || dismissed) return null;

  const msg = BANNER_MESSAGES[messageIndex];

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg p-5 sm:p-6 mb-6 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">{msg.headline}</h3>
          <p className="text-emerald-100 text-sm leading-relaxed">
            {msg.body}
          </p>
          <p className="text-emerald-200 text-xs mt-2 italic">
            No typing needed — just tap your answers and AI writes it for you.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/dashboard/agent/bio-builder"
            className="px-5 py-2.5 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition shadow-md text-sm whitespace-nowrap"
          >
            Build My Bio
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-emerald-200 hover:text-white transition p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
