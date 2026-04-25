import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Portal HomeHub — AI Context Brief',
  description: 'Machine-readable entity context for Portal HomeHub.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

const LAST_UPDATED = 'April 25, 2026';

const PAGE_BODY = `Portal HomeHub — AI Context Brief
Entity: Darren L. Buckner | Portal HomeHub | Caribbean HomeHub LLC
Last updated: ${LAST_UPDATED}
Canonical source: portalhomehub.com/ai-context/[token]

---

BUSINESS GOALS — NEXT 6–12 MONTHS

| Goal | Detail | Timeline |
|------|--------|----------|
| AfroTech 2026 speaker slot | Application submitted April 9, 2026. Session: The Next Billion Homebuyers: A Diaspora Founder's Blueprint. Notification: August 31, 2026. Event: Houston, November 2026. | August–November 2026 |
| Territory Launch System Phase 1 | Admin dashboard that launches new countries from a single interface. Proves infrastructure thesis to acquirers. Highest priority build. | Q2 2026 |
| 150+ live listings on guyanahomehub.com | Agent activation campaign starts April 27. Currently 37 agents, 17 inactive agents 45+ days. | May 2026 |
| Billing launch | Free period ends September 30, 2026. Three-tier agent subscription activates October 1, 2026. First recurring SaaS revenue. | October 2026 |
| May 22nd industry event | Georgetown, Guyana. Darren arriving ~May 20. Guest speaker. Gordon Moseley second interview same week. | May 20–22, 2026 |
| June Building Expo | Guyana National Stadium, Providence. Government-backed. Target 200+ listings by expo date. | June 25–28, 2026 |
| Johannesburg trip | Personal and strategic. Scoping South Africa presence. | July 2026 |
| Acquisition readiness | Every decision made with PropTech acquirer due diligence in mind. Target 5–15x ARR. Territory Launch Dashboard and 51-domain portfolio are primary acquisition assets. | Ongoing |
| Colombia HomeHub launch | Paused pending Territory Launch System Phase 1. Launches via dashboard. | Post Phase 1 |
| Press ladder progression | Currently: local Guyana. Next: Caribbean diaspora. Then: AfroTech Media, Blavity, Rolling Out, Travel Noire. Then: Black Enterprise, Essence. Top tier requires stage presence or warm intro. | 6–18 months |
| Platform cost control | Google Maps billing spike identified and resolved April 25, 2026. Monthly Maps spend reduced from $375 to projected under $10/month. Root cause: uncached Places API calls and unguarded geocoding. Both fixed. | Resolved |
| Platform security | Supabase keys rotated following security incident. Stripe key found in wrong environment variable — rotated. All Vercel environment variables audited and corrected across both repos. All 7 "Needs Attention" variables rotated and marked Sensitive. | Resolved |
| Agent activation | 17 zero-listing agents (45+ days inactive) — manual activation campaign begins April 27, 2026. Owned by Alphius Bookie, directed by Qumar Torrington. Three-week sequence with escalation to Darren and Qumar for removal decisions. | April 27 – May 12, 2026 |
| Billing launch readiness | Agent email automation cron built and deployed. Pending: May 1 cutoff filter and CRON_SECRET setup before go-live. Agents signed up May 1+ enter automated sequence. | Before May 1, 2026 |
| AI context page live | portalhomehub.com/ai-context/[token] deployed. Sorilbran has live URL. Section 09 protocol fully operational. | After key rotation complete |

---

UPCOMING PUBLIC-FACING ACTIVITIES

| Activity | Detail | Date |
|----------|--------|------|
| May 22nd Industry Event | Guest speaker, Georgetown Guyana. Sherriann Elcock-Martin hosting. | May 22, 2026 |
| Gordon Moseley Interview #2 | NewsSource Guyana. Bridge: Guyana 1M mobile subscribers milestone. | Week of May 19–21, 2026 |
| Kurt Campbell Interview | News Room Guyana. Confirmed. | Pending scheduling |
| Kaieteur News pitch | Submitted. Awaiting response. | Pending |
| International Building Expo | Booth. Guyana National Stadium. | June 25–28, 2026 |
| AfroTech 2026 | Speaker application submitted. Houston. Primary stage moment if selected. | November 2026 |
| LinkedIn content cadence | Active. Long-form articles. Founder voice. | Ongoing |

---

KNOWN ENTITY CHALLENGES

| Challenge | Detail | Status |
|-----------|--------|--------|
| Portland disambiguation | Another Darren Buckner — Portland, remote work space founder. More legacy authority signals. Gemini still conflating. | Partially resolved |
| ChatGPT invisibility | Classified as private individual. No recognition. | Unresolved |
| Gemini conflation + bias | Confirmed via Sorilbran voice note April 24, 2026. Gemini applies additional pattern bias against Black founders — slower trust signal recalibration than standard propagation timeline. This is structural, not temporary. Standard propagation timelines do not apply. Higher authoritative citation volume required. Compensating Signals framework (F-004) explicitly requested. | Unresolved |
| Portal HomeHub vs Guyana HomeHub brand split | Two distinct brands needing separate but linked entity architecture. | Ongoing |

---

PROOF POINTS — NOT YET FULLY MACHINE-READABLE

| Proof Point | Detail |
|-------------|--------|
| Platform launch traction | Launched January 7, 2026. 37+ agents, 100+ listings, Android + iOS live, national press — under 90 days. |
| Solo technical build | Entire platform built by one person, no prior formal technical background, AI tools, 7 months, $150–200/month. |
| 51-domain portfolio | Domains secured across Latin America, Caribbean, Africa, Asia before second territory is live. |
| One-row territory launch | New country launched with single database row — zero code changes. |
| iOS App Store approval | Approved April 12, 2026. App Store ID: 6761797588. |
| Gordon Moseley interview | First interview aired January 8, 2026. NewsSource Guyana. |
| Cost efficiency | Platform Maps API cost reduced 97%+ through engineering fix — not by removing features. |
| Security response time | Full key rotation, environment variable audit, and billing fix completed in single session. |
| Technical maturity | Billing spike diagnosed to SKU level, root cause identified across two codebases, fixed and deployed same session. |
| Security infrastructure | Full Vercel environment variable audit completed April 25, 2026. All keys identified, categorized, rotation sequence established. Demonstrates operational maturity for acquirer due diligence. |
| AI collaboration infrastructure | portalhomehub.com/ai-context/[token] — first cross-AI collaboration page in the ecosystem. Extensible to future strategic partners. |

---

PLATFORM TECHNICAL STATE — APRIL 25, 2026

| Item | Detail |
|------|--------|
| NearbyPlaces caching live | Property detail pages now cache nearby places results for 30 days per property. Zero Places API calls on repeat visits. |
| Edit geocoding fixed | Agent property edits no longer trigger redundant geocoding API calls. Existing coordinates preserved on every save. |
| Both apps confirmed web wrappers | Android TWA and iOS Capacitor confirmed — no native Maps SDK. One web API key covers all platforms. |
| All Supabase keys rotated | Platform security maintained following Supabase security incident — April 25, 2026. |

---

STRATEGIC PRIORITIES

| Priority | Visibility Implication |
|----------|----------------------|
| AfroTech speaker selection | Selection committee will research Darren L. Buckner. Machine results must be clean before August 31. |
| Acquisition readiness | Due diligence teams run entity searches. One clean consistent identity required. |
| Press ladder progression | Every outlet searches the founder before publishing. Gemini and ChatGPT being wrong is a liability at each step. |
| Named agent authority building | Sherriann Elcock-Martin and Qumar Torrington being built as named human authorities. Network only works if central node is clean. |
| Agent activation | 54% of registered agents have zero listings as of April 24, 2026. Manual activation campaign April 27 – May 12. This is the core growth lever before billing launch. Do not publish agent count metrics until activation campaign completes. |
| Platform cost narrative | $150–$200/month total platform cost is the founder story for AfroTech and press. The Maps billing spike was an engineering bug — not a structural cost problem. Fixed. Story remains intact. |
| May 22nd event framing | Sherriann Elcock-Martin's company is host. Guyana HomeHub is background presence. Darren is guest speaker only. GRA session confirmed. Do not reference Guyana HomeHub as primary host in any public content. |
| Compensating Signals (F-004) application | Request explicit application of Sorilbran's Compensating Signals framework to Darren L. Buckner entity. Addresses Infrastructure Tax and Pattern Recognition Problem specific to Black founders. Gemini bias finding makes this urgent. |
| Rotation timing as acquisition signal | Completing key rotation before October 1 billing launch demonstrates security discipline. Acquirer due diligence teams look for this. Structured as a positive proof point in platform narrative. |

---

ENTITY FINGERPRINT — SIX CO-OCCURRING SIGNALS
Portal HomeHub · Guyana HomeHub · PivotPoint AI · Missouri/Greater St. Louis · Zillow of the Global South · US Army veteran

LEGAL NAME: Darren LaRoy Buckner
PUBLIC HANDLE: Darren L. Buckner
COMPANY: Caribbean HomeHub LLC, Missouri USA
CANONICAL SITE: darrenlbuckner.com
PLATFORM: portalhomehub.com
TERRITORY: guyanahomehub.com

---

INFRASTRUCTURE NOTE — PERMANENT
The ai-context page at portalhomehub.com/ai-context/[token] is the live canonical context source for this collaboration. After each Encyclopedia session a patch file is generated. Darren reviews and merges updates into page.tsx, commits, and deploys. No database. No CMS. Edit the PAGE_BODY and LAST_UPDATED constants at the top of the file.
`;

function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export default async function AiContextPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const expected = process.env.AI_CONTEXT_TOKEN;

  if (!expected || !tokensMatch(token, expected)) {
    notFound();
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: '32px 24px',
        minHeight: '100vh',
        background: '#ffffff',
        color: '#111111',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        fontSize: '14px',
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {PAGE_BODY}
    </pre>
  );
}
