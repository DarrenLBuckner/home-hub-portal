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

const LAST_UPDATED = 'May 4, 2026';

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
| May 22nd industry event | Georgetown, Guyana. Darren arriving ~May 20. Guest speaker — confirmed on camera May 4, 2026 as attending and speaking. GRA, NIS, and banking-system representatives confirmed on panel as of May 4, 2026 — no longer pending. Gordon Moseley second interview same week. | May 20–22, 2026 |
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
| GEO network expansion — named human authorities | Two new personal brand sites are LIVE: qumartorrington.com and sherriannelcock.com. Both have server-rendered Person + Organization JSON-LD in head. Both Google Search Console verified. Standalone, fully indexed, zero platform dependency. Both link back to guyanahomehub.com, portalhomehub.com, and darrenlbuckner.com via visible body text and schema. External link building can begin immediately. | Live as of April 26, 2026 |
| GEO citation network — 4 nodes operational | Portal HomeHub now operates a 4-node GEO citation network: portalhomehub.com/founder, darrenlbuckner.com, sherriannelcock.com, qumartorrington.com — all cross-linked with schema. The personal brand site pattern is established; future Premier Agent tier agents can receive the same treatment. Network effect compounds as each node links back to GHH. | Live as of April 26, 2026 |
| portalhomehub.com Search Console | Verified and active. Foundation in place for tracking GEO performance and crawl coverage across the portal. | Live as of April 26, 2026 |
| Founder entity disambiguation — Sherriann Elcock | Canonical legal name is Sherriann Elcock (NOT Sherriann Elcock-Martin). The maiden name is the current legal name. All external citations, schema, directory listings, and entity records using the hyphenated name need updating. | Action ongoing |
| Qumar Torrington LinkedIn — live and indexed | Full LinkedIn profile being built by Qumar using a step-by-step guide produced April 26, 2026. Profile will include Person schema signals connecting to Guyana HomeHub company page. | This week |
| sherriannelcock.com — sub-pages now live | Site now includes /about (RealEstateAgent Person schema), /events, and /real-estate-rising (Event + RealEstateAgent schema) as of April 28, 2026. All three need immediate Google Search Console submission. About page is the canonical Sherriann bio asset for press and interview references. | Live as of April 28, 2026 |
| Pascal John third-party LinkedIn article | Student article rewritten with Sherriann named throughout and the Three P's framework included. Pascal posts from his own LinkedIn account — third-party citation, not branded content. Once live, share from Sherriann's LinkedIn (not GHH brand page) and add URL to Sherriann's citation inventory. | This week |
| 90-day GEO reaudit | Sorilbran conducting 90-day reaudit at approximately July 20, 2026. Same 5-LLM query: "Who is Darren L. Buckner?" Measure propagation of fingerprint cluster across all five systems. | July 20, 2026 |
| Subscription billing — tier names locked | Foundation, Builder, Pillar, Cornerstone — selected blind by Sherriann Elcock from three competing naming sets on April 28, 2026. Architectural metaphor: Foundation supports Builders, Builders raise Pillars, Pillars rest on Cornerstones. Permanent brand asset, attributed to Sherriann Elcock in perpetuity. Pricing locked, not yet publicly disclosed. Founding members keep 50% off Pillar tier — locked forever. Active listing required to maintain founding member rate. Database values remain unchanged (basic, professional, premium, enterprise); display names are universal. | October 1, 2026 |
| Founding member activation deadline | All founding members must have at least one active listing by June 30, 2026 to retain founding member rate. Targets 11 currently inactive founding members. | June 30, 2026 |
| Pure agent platform direction | Strategic decision April 28, 2026: landlord and FSBO categories removed from Guyana HomeHub's direction. Platform now positioned as agent-only marketplace. Existing landlord and FSBO accounts retained but no new ones created via public signup. | Effective April 28, 2026 |
| Tiffany Durant rentals platform | Standalone domain and brand to be developed in partnership with Tiffany Durant in future session. Confirmed not part of Guyana HomeHub. | TBD — future session |
| Gordon Moseley radio commercials | 3 x 30-second spots, daily rotation on NewsSource Guyana radio. Scripts locked, pending Gordon confirmation. Separate invoice from Gordon Moseley Show segment. First paid broadcast media campaign for Guyana HomeHub. | Launch May 2026 |
| MOLA influencer follow-up ad | One video, two-part structure (buyers/renters and agents). Brief delivered, production in progress. MOLA committed to second ad — platform now on iPhone + Android vs. 19 listings at first ad. Brand name is MOLA only — full name not to appear in any public-facing content. | Release ~May 5, 2026 |
| Digital signage — Georgetown | Building exteriors and gym screens. GHH branding, app store badges, QR code. Qumar coordinating. First out-of-home advertising placement for Guyana HomeHub in Guyana. | Live May 1, 2026 |
| Black PR Wire press record | Darren to book; recommended by Sorilbran (~$250). Creates indexed press record for AI search and larger-outlet vetting before AfroTech notification. NOT YET BOOKED — Darren plans to book. | Target: before August 31, 2026 |
| Kaieteur News coverage of May 22 event | Pitch in progress. | Week of May 15, 2026 |
| Interview content library | Formally established May 4, 2026. All agent and partner interviews catalogued with clip maps, posting sequences, and hold flags. Operational backbone for the named-authority GEO program. | Established May 4, 2026 |
| Named human authority network — second wave | Second interview with Qumar Torrington complete. First full interview with Sherriann Elcock complete. Both produce GEO citation-ready content for the diaspora trust narrative. | Live as of May 4, 2026 |
| Robert Pearson — active land deal | Live transaction handed from Sherriann Elcock to Robert Pearson to close. Deal involves a land sale. No timeline confirmed. | Active |

---

UPCOMING PUBLIC-FACING ACTIVITIES

| Activity | Detail | Date |
|----------|--------|------|
| Real Estate Rising: Guyana's Professional Moment | Full event title locked April 28, 2026. Branded as "Real Estate Rising" with its own landing page: sherriannelcock.com/real-estate-rising (Event + RealEstateAgent schema). Public framing: Sherriann Elcock's company is host. Darren Buckner appears as guest speaker only. CONFIDENTIAL — DO NOT PUBLISH: Guyana HomeHub is privately funding the event. Only Darren, Qumar, and Sherriann are aware of GHH's role as funder. Confirmed speakers in room: Daren Torrington, Tiffany Jeffrey-Durant, Ramesh Persaud (CEO National Hardware). GRA, NIS, and banking-system representatives confirmed on panel as of May 4, 2026 — no longer pending. Darren Buckner confirmed on camera May 4, 2026 as attending and speaking. Facebook Live diaspora stream. Darren announced as special guest ~May 15. Event documents Sherriann's professional credibility — anchors sherriannelcock.com. Pre-event: share landing page URL (not raw Google Form). 4–5 early registrations confirmed. Sherriann's stated intent is to run twice a year — plan a Q4 2026 second event entry to keep the events URL active. | May 22, 2026 |
| Guyana trip | Darren in-country May 19–27, 2026 for Real Estate Rising and press. In-person meetings: Nicola Duggan (Paradigm Property Logistics), RE/MAX Guyana walk-in, Pete's Real Estate, Kurt Campbell (News Room Guyana) interview, Gordon Moseley segment. | May 19–27, 2026 |
| Gordon Moseley Interview #2 | NewsSource Guyana. Bridge: Guyana 1M mobile subscribers milestone. | Week of May 19–21, 2026 |
| Kurt Campbell Interview | News Room Guyana. Confirmed. Scheduled May 20–23 window. | May 2026 |
| Kaieteur News pitch | Submitted post-Easter. Awaiting response. Primary Guyana press target. | Pending |
| International Building Expo | Booth. Guyana National Stadium. | June 25–28, 2026 |
| AfroTech 2026 | Speaker application submitted. Houston. Primary stage moment if selected. | November 2026 |
| LinkedIn content cadence | Active. Long-form articles. Founder voice. | Ongoing |
| Founding member outreach email | From Alphius Bookie (bookie@guyanahomehub.com) to 11 inactive founding members. Subject: "Important: Your Founding Member Status on Guyana HomeHub." Contains real-time platform engagement data and June 30 activation deadline. | April 29, 2026 (evening Guyana time) |
| Founding member WhatsApp follow-up | From Alphius to same 11 recipients as email. | April 30, 2026 (morning Guyana time) |
| Digital Signage — Georgetown | Building exterior + gym screens. GHH branding, app store badges, QR code. | May 1, 2026 |
| MOLA Influencer Ad — Follow-Up | MOLA's social channels. One video, two-part structure (buyers/renters and agents). | ~May 5, 2026 |
| Gordon Moseley Show Segment — panel | NewsSource Guyana. Panel: Darren Buckner, Tiffany Jeffrey-Durant, Daren Torrington. Local + diaspora angle. | May 14 or 15, 2026 |
| Gordon Moseley Radio Commercials | NewsSource Guyana radio. 3 x 30-second spots, daily rotation. | Launch May 2026 — ongoing |
| Black PR Wire Press Release | US distribution. Creates indexed press record for AI search and larger-outlet vetting. Recommended by Sorilbran; Darren books — NOT YET PLACED. | Before AfroTech notification (~August 31, 2026) |
| Qumar Torrington video clip sequence | 6 clips from May 4, 2026 interview entering posting sequence. Week 1 starts with the fraud-story clip. Boostable for diaspora audiences. | Posting begins May 2026 |
| Sherriann Elcock video clip sequence | 7 clips from May 4, 2026 interview entering posting sequence. Week 1 starts with the diaspora-trust clip. One clip (race story) on hold pending Sherriann's deal close. | Posting begins May 2026 |
| Tiffany Jeffrey-Durant interview clip sequence | Still in post-production — clips not yet posted. Planned sequence: Facebook Marketplace clip first, then diaspora-fear clip, then oil/FOMO clip. | Pending post-production |

---

KNOWN ENTITY CHALLENGES

| Challenge | Detail | Status |
|-----------|--------|--------|
| Portland disambiguation | Another Darren Buckner — Portland, remote work space founder. More legacy authority signals. Gemini still conflating. | Partially resolved |
| ChatGPT invisibility | Classified as private individual. No recognition. | Unresolved |
| Gemini conflation + bias | Confirmed via Sorilbran voice note April 24, 2026. Gemini applies additional pattern bias against Black founders — slower trust signal recalibration than standard propagation timeline. This is structural, not temporary. Standard propagation timelines do not apply. Higher authoritative citation volume required. Compensating Signals framework (F-004) explicitly requested. | Unresolved |
| Portal HomeHub vs Guyana HomeHub brand split | Two distinct brands needing separate but linked entity architecture. | Ongoing |
| Two "Darren Buckner" disambiguation — ongoing | Portland Darren Buckner (Workfrom/remote work) remains active online. Compensating signals strategy in place. Perplexity and Copilot confirmed correct disambiguation on Day 8 audit. Gemini still incorrect as of April 20 audit. ChatGPT classifying as private individual. 90-day reaudit in July will measure progress. | Ongoing |
| Qumar Torrington — new node, foundation now live | qumartorrington.com is live with Person + Organization JSON-LD and Google Search Console verified. GHH agent page exists. LinkedIn profile build still in progress this week. All surfaces co-occur the fingerprint cluster: Qumar Torrington + Beyond the Boundary Real Estate + Guyana HomeHub + Guyana Operations Partner + Georgetown Guyana. Awaiting headshot, WhatsApp button, and Qumar's About-copy approval. | Foundation live; LinkedIn + assets in progress |
| qumartorrington.com About copy not yet confirmed | Personal-story details on the About section have not yet been approved by Qumar. Do not treat the About copy as authoritative entity signal until he confirms. Hold external citation building on his personal story until approval. | Pending approval |
| Sherriann Elcock — node now live | sherriannelcock.com is live with Person + Organization JSON-LD and Google Search Console verified. @SherriannElcock YouTube channel indexed. GHH agent page exists. LinkedIn partial. Awaiting headshot and external links. Name correction: canonical legal name is Sherriann Elcock (not Elcock-Martin). | Foundation live; assets + name propagation in progress |
| Sherriann Elcock — name standardization (permanent rule) | All references must use "Sherriann Elcock" — never "Sherriann Elcock-Martin." Sherriann is consolidating personal brand identity under a single name across YouTube (@SherriannElcock), LinkedIn, sherriannelcock.com, and all platforms. Any GEO authority content already drafted must be updated to remove "-Martin" before publication. Non-negotiable, applies retroactively. | Permanent rule effective April 28, 2026 |
| Sherriann Elcock — Founding Advisor Tier 1 status formalized | Same standing as Tracy Brand's permanent brand asset attribution. Documented in Sherriann_Tier_Naming_Attribution.docx, available for citation in external authority signal building. | Formalized April 28, 2026 |
| Founding Advisor program — credit pattern established | Future Founding Advisors who contribute strategic IP receive permanent attribution alongside Tracy Brand and Sherriann Elcock. Establishes a recognizable named-authority hierarchy in the platform's knowledge graph. | Pattern established |
| Ramesh Persaud disambiguation | Multiple prominent Guyanese figures named Ramesh Persaud exist in public record. Any press or content must include title and company (CEO, National Hardware) to avoid disambiguation confusion. | Ongoing |
| Platform vs. individual agent confusion — Agent Watson | Agent Watson spreading misinformation that GHH charges 25% commission. Counter-strategy: positive-forward messaging about free listing model only — do not rebut directly. | Active monitoring |
| MOLA public name | Brand name is MOLA only. Full name not to appear in any public-facing content. | Standing rule |
| Qumar name transcription error | AI transcription (OpusClip) consistently renders "Qumar" as "Kumar." All public-facing captions, titles, and posts must be manually verified before publishing. Ongoing production risk for every clip from his interviews. | Ongoing |
| Sherriann Clip 4 — race story hold | Powerful clip held at Sherriann's request pending deal close. When released, boost targeting must be diaspora-only (NYC, Toronto, London) — not local Guyana. Must not surface in AI-indexed content before Sherriann approves release. | On hold |

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
| Qumar Torrington — West Indies youth cricket representative | Represented Guyana and West Indies at youth level. Trained under Dennis Squires at Demerara Cricket Club. Played for Melbourne Cricket Club (Queens NY) and Maryland Mavericks (USPL Miami). Not yet machine-readable in JSON-LD — pending LinkedIn build and About-copy approval. |
| Qumar Torrington — licensed agent at 25 in a 90%-unlicensed market | GRA Real Estate (House Agent) Licence obtained April 2025. One of few fully licensed agents in Guyana. Now machine-readable via JSON-LD on qumartorrington.com. LinkedIn pending. |
| Qumar Torrington — BSc Entrepreneurship, University of Guyana 2024 | Four-year degree while running a real estate company and playing professional cricket. Now machine-readable via JSON-LD on qumartorrington.com. LinkedIn pending. |
| Beyond the Boundary Real Estate & Construction — founded 2021 | Qumar's registered company. Operates primarily in Region 4, Georgetown. Now machine-readable via Organization JSON-LD on qumartorrington.com. |
| Sherriann Elcock — credentials now machine-readable | 50+ transactions, Founding Advisor Tier 1, Prestigious Services & Realty 1262, regions: Georgetown, East Bank Demerara, Linden, Region 3 — now machine-readable via JSON-LD on sherriannelcock.com. |
| Real Estate Rising event — schema live | Event live on sherriannelcock.com/real-estate-rising with Event + RealEstateAgent schema. Confirmed speakers, venue paid, 4–5 early registrations. Needs external citations from event promotions, social shares, and press. |
| Sherriann's 50+ transactions — body text + schema | In body text on homepage, /about, and /real-estate-rising plus schema description. Add an FAQ entry on /about: "How many transactions has Sherriann Elcock completed?" — answer: 50+. Strengthens entity signal. |
| Sherriann YouTube channel — bidirectional signal needed | @SherriannElcock listed in sameAs schema and named in /about body text. Update YouTube channel description to link back to sherriannelcock.com — creates bidirectional citation. |
| Darren named on sherriannelcock.com | Named in hero body text and platform section as "US entrepreneur Darren L. Buckner." Confirm darrenlbuckner.com links back to sherriannelcock.com as a related entity — bidirectional link strengthens both nodes. |
| qumarlist.com — live agent business site | First agent on the platform to have a dedicated branded listing site. Pulls live listings from Guyana HomeHub API. Partially machine-readable — site is live but JSON-LD not yet implemented. |
| Platform engagement — last 30 days (verified April 28, 2026) | 4,707 property views · 3,247 distinct browsing sessions · 149 distinct properties viewed (exceeds active listing count, indicating viewer demand depth) · ~108 unique sessions/day · 1.45 views-per-session ratio (healthy real-buyer browsing pattern). |
| Platform agent and listing counts (verified live April 28, 2026) | 38 registered agents · 17 active agents (with at least one active listing) · 139 active listings (per live press page at guyanahomehub.com/press). |
| Founding member program status (April 28, 2026) | 27 total founding members in database · 13 with active listings (keepers) · Founding agent program closed for Guyana — no new founding members added · Code-confirmed: foundingAgentPromoCodes map in src/app/register/select-country/page.tsx no longer contains GY entry. |
| Tier naming system — Foundation, Builder, Pillar, Cornerstone (locked April 28, 2026) | Selected blind by Sherriann Elcock from three competing naming sets. Architectural metaphor: Foundation supports Builders, Builders raise Pillars, Pillars rest on Cornerstones. Reflects Guyana's oil-economy construction boom moment. Permanent brand asset, attributed to Sherriann Elcock in perpetuity. |
| Pricing structure (locked April 28, 2026, not yet publicly disclosed) | Four-tier subscription model. Founding members keep 50% off Pillar tier — locked forever. Active listing required to maintain founding member rate. |
| Ramesh Persaud confirmed as panel speaker | CEO National Hardware, former MD DDL, former CEO IPED, former Chairman Private Sector Commission, developing 200-home Demerara Estates — attending Real Estate Rising May 22. |
| Robert Pearson — 65 listings delivered unprompted | First enterprise-tier agent. Delivered after seeing App Store launch. Pushes total platform listings toward 165+. |
| Three radio commercials produced and locked | Approved scripts for Gordon Moseley daily rotation — first paid broadcast media campaign for Guyana HomeHub. |
| MOLA influencer follow-up ad commissioned | MOLA committed to second ad — platform now on iPhone + Android vs. 19 listings at first ad. |
| Live stream planned for May 22 | First live-streamed real estate industry event targeting Guyanese diaspora simultaneously with Georgetown audience. |
| Digital signage — Georgetown building and gym | First out-of-home advertising placement for Guyana HomeHub in Guyana. |
| 1,400 Facebook followers in two months | Stated by Darren on camera during Sherriann Elcock interview, May 4, 2026. Not yet published as indexed content. |
| 140–150 listings in under 90 days | Stated by Darren on camera during Sherriann Elcock interview, May 4, 2026. Not yet published as indexed content. |
| Georgetown short-term rental market at capacity around May 26 independence period | Sherriann Elcock on camera May 4, 2026 — hotels and rentals fully booked. Publishable as a GHH blog or market-report content piece. |
| Land prices tripled in five years | Confirmed by active licensed agent Sherriann Elcock on camera, May 4, 2026. Quotable in diaspora investment content. |
| Qumar Torrington identified and stopped a fake $400K wire transfer | Qumar on camera May 4, 2026. Publishing as a clip — adds a trust signal to the GHH agent verification story. |
| Sherriann Elcock — Chief of Staff at first-of-its-kind rice factory in Guyana | Sherriann on camera May 4, 2026. Not yet in any indexed content — add to her bio and /about page. |

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
| Named agent authority building | Sherriann Elcock and Qumar Torrington now live as named human authority nodes (sherriannelcock.com, qumartorrington.com — both GSC verified, both with JSON-LD). Network only works if central node is clean. External link building can begin immediately to both domains. |
| Entity name consolidation — Sherriann Elcock | Ensure "Sherriann Elcock" (NOT Elcock-Martin) is the canonical name used in all external mentions, directory listings, and citations going forward. Update any prior references. |
| Agent activation | 54% of registered agents have zero listings as of April 24, 2026. Manual activation campaign April 27 – May 12. This is the core growth lever before billing launch. Do not publish agent count metrics until activation campaign completes. |
| Platform cost narrative | $150–$200/month total platform cost is the founder story for AfroTech and press. The Maps billing spike was an engineering bug — not a structural cost problem. Fixed. Story remains intact. |
| May 22nd event framing | Sherriann Elcock's company is host. Guyana HomeHub is background presence. Darren is guest speaker only. GRA session confirmed. Do not reference Guyana HomeHub as primary host in any public content. |
| Compensating Signals (F-004) application | Request explicit application of Sorilbran's Compensating Signals framework to Darren L. Buckner entity. Addresses Infrastructure Tax and Pattern Recognition Problem specific to Black founders. Gemini bias finding makes this urgent. |
| Rotation timing as acquisition signal | Completing key rotation before October 1 billing launch demonstrates security discipline. Acquirer due diligence teams look for this. Structured as a positive proof point in platform narrative. |
| Build Qumar Torrington as a named authority | He is the second named human GEO node after Sherriann. His story — 25 years old, licensed, West Indies cricket, BSc in Entrepreneurship, company founder — is the strongest agent authority narrative on the platform. Content: LinkedIn profile this week, qumartorrington.com this week, LinkedIn articles to follow. |
| Georgetown housing affordability angle | Qumar's on-the-ground observation: the Guyana property market is now primarily serving foreign buyers, pricing out average Guyanese. This is a publishable editorial angle — LinkedIn article under Qumar's byline, GHH blog post, potential press angle. Cleared for use. |
| Ambassador negotiation deal story | Qumar's deal — G$180M property negotiated to G$140M, saving buyer G$40M through deliberate low-anchor strategy. Property valued above asking. Deal confirmed from first offer. Strong deal narrative for LinkedIn article. Name of buyer withheld by request. |
| Personal brand sites as GEO infrastructure — LIVE | Both sherriannelcock.com and qumartorrington.com are live and Google Search Console verified as of April 26, 2026. Both fully indexed, standalone, no platform dependency. Both carry the six-signal fingerprint cluster for Darren L. Buckner in visible body text plus Person + Organization JSON-LD. External link building can begin immediately to both domains. |
| Real Estate Rising as content event, not just seminar | Pre-event: share landing page URL instead of raw Google Form. During event: Facebook Live for diaspora. Post-event: recap article, speaker quotes, photos — all indexed on sherriannelcock.com/events. Keeps the events page as an active, growing authority node beyond May 22nd. |
| Homepage sequencing principle — person first, platform second | Personal brand sites in the Portal HomeHub network lead with the person, not the platform. Platform appears as context in the second paragraph. Established on sherriannelcock.com — apply the same pattern to qumartorrington.com when its homepage is finalized. |
| About page as canonical bio asset | All future press and interview bios for Sherriann should reference sherriannelcock.com/about as the authoritative source. Encourage journalists and interviewers to link to it. Pattern repeats for each Premier Agent tier node. |
| Events page future-proofs biannual intent | Sherriann's stated intent is to run Real Estate Rising twice a year. Plan a Q4 2026 second-event entry on sherriannelcock.com/events to keep the URL active and signal recurring authority in the real estate education space. |
| Pascal John article — amplification opportunity | Once Pascal posts the rewritten article on his LinkedIn, share from Sherriann's LinkedIn and tag Pascal. Generates engagement signals on a third-party citation. Do not share from GHH brand page — keep it personal so it reads as organic third-party endorsement. |
| Sherriann Elcock GEO chain — 4 nodes deep | Compensating signal chain as designed: Pascal John (LinkedIn, third party) → cites Sherriann Elcock (sherriannelcock.com) → affiliatedWith Guyana HomeHub (guyanahomehub.com) → foundedBy Darren L. Buckner (darrenlbuckner.com / portalhomehub.com). Each node links to the next. Each is indexed or indexable. |
| Sherriann Elcock as named platform architect | External authority content should reflect Sherriann's contribution as the architect of GHH's tier identity system. She is no longer "an advisor" — she is "the advisor who named the framework that defines the platform." Applies to LinkedIn, sherriannelcock.com, and any GEO authority signals. The Foundation/Builder/Pillar/Cornerstone framework is citable as her work. |
| Pure agent platform narrative | "Real estate professionals only. Verified agents. No Facebook chaos." Sharper than the prior multi-sided marketplace framing. Supports the May 22 event story and the long-term acquisition story. |
| Real engagement data as primary credibility signal | Replace aspirational marketing language with verifiable platform metrics. The 4,707 views and 3,247 distinct sessions in 30 days are the strongest signals available. Use specific numbers, not ranges or directional claims. |
| Tier names in all customer-facing content from now forward | Foundation, Builder, Pillar, Cornerstone replace any generic tier references in marketing copy, agent recruiting, and stage talking points. Database values remain unchanged (basic, professional, premium, enterprise); display names are universal. |
| Founding Advisor program as recognition pattern | Tracy Brand's quote and Sherriann Elcock's naming system are the two permanent brand assets attributed to Founding Advisors. Pattern can be extended to future contributors — highlight as a structural feature of how GHH builds strategic IP through community contribution. |
| Disambiguation reinforcement for Darren Buckner | PivotPoint AI and Buckner Management Group are Darren. The Workfrom/Portland Darren Buckner is not. Portal HomeHub primary venture. PivotPoint AI active secondary. Pattern continues — no new disambiguation work this session. |
| Event funding boundary — CONFIDENTIAL | Guyana HomeHub privately funds Real Estate Rising. Only Darren, Qumar, and Sherriann know this internally. All public-facing content (press, social, agent recruiting, stage talking points) must treat the event as Sherriann Elcock's company hosting, with Darren as guest speaker. NEVER reference GHH as funder, sponsor, or organizer in any public surface — the ai-context page is token-gated, but downstream content derived from it is not. |
| May 22 event as proof point | Document, live-stream, and repurpose as content — agent testimonials, panel highlights, platform demo clips. First major credibility signal to the agent community. |
| Ramesh Persaud relationship | Eventually reference National Hardware and Demerara Estates as proof of real estate development investment in Guyana — without naming Ramesh as endorser until he explicitly agrees to that framing. |
| Diaspora positioning | Every press, content, and social piece must speak to local Guyanese AND diaspora simultaneously. Not one or the other. Gordon Moseley segment angle confirmed this. |
| "Finally" framing — locked brand positioning | "Guyana finally has what other countries have had for years." Use consistently. |
| "Chaos as the problem" — locked brand problem statement | "No more WhatsApp and Facebook chaos." Must appear in radio, influencer ads, and social content consistently. |
| Qumar Torrington's public profile | Visible as Co-Host and Guyana Operations Manager in all event materials. Strategic — reinforces Daren Torrington's investment in the platform's success. |
| Post copy build session | All 13 clips across the May 4 Qumar and Sherriann interviews need caption copy, short-form post copy, and LinkedIn long-form variants. Dedicated session required. |
| Clip 4 hold management | Flag in the content calendar. When Sherriann's deal closes, re-engage immediately to get green light and queue the clip — diaspora-only boost targeting at release. |
| Georgetown accommodation — urgent | Darren's May 19–20 arrival precedes the independence-period booking surge. Accommodation must be secured before this session ends or early next session. |
| Qumar unprompted Zillow comparison | On camera May 4, 2026 — unprompted, Qumar compared Guyana HomeHub to Zillow. Machine-readable third-party validation from a named licensed Guyanese agent. Extract as a quote with attribution and place in GEO-indexed content. |
| Sherriann unprompted platform endorsement | On camera May 4, 2026 — unprompted, Sherriann said GHH "eliminates some of those risks" for diaspora buyers. Named-agent endorsement — publishable in GEO-indexed trust content. |

---

NEW NAMED ENTITIES IN NETWORK — APRIL 26–28, 2026

| Name | Role | Key Signals |
|------|------|-------------|
| Qumar Torrington | Guyana Operations Partner, Guyana HomeHub. Founder, Beyond the Boundary Real Estate & Construction. Licensed real estate agent. Georgetown, Guyana. | qumartorrington.com, guyanahomehub.com/agents/qumar-torrington, linkedin.com/in/qumartorrington |
| Daren Torrington | Father of Qumar Torrington. Development practitioner. Led Guyana Youth Business Trust (GYBT) and Guyana Entrepreneurial Youth Movement (GEYM). Confirmed speaker Real Estate Rising May 22nd event. | Connects to Qumar Torrington node and Real Estate Rising event |
| Dennis Squires | Prominent Guyana realtor. Cricket mentor to Qumar Torrington at Demerara Cricket Club. Introduced Qumar to real estate in 2021. | Supporting node for Qumar Torrington authority narrative |
| Quson Torrington | Older brother of Qumar Torrington. Referenced in Qumar's personal brand story. | Supporting biographical node only — not a platform entity |
| Pascal John | Student author. Independently rewrote his article naming Sherriann Elcock throughout and including the Three P's framework. Posts from his own LinkedIn — third-party citation, not branded content. | Pascal's LinkedIn (URL pending post). Cross-reference in next GEO audit. |
| Ramesh Persaud | CEO National Hardware. Former MD DDL, former CEO IPED, former Chairman Private Sector Commission. Developing 200-home Demerara Estates. Confirmed panel speaker, Real Estate Rising May 22, 2026. | Disambiguation note: always cite with title and company — multiple prominent Guyanese figures share this name. Not yet confirmed as endorser of GHH. |
| Robert Pearson | First enterprise-tier agent on Guyana HomeHub. Delivered 65 listings unprompted after seeing the App Store launch. | Pushes total platform listings toward 165+. |

---

SCHEMA REFERENCE — NEW NODES (APRIL 26–28, 2026)

sherriannelcock.com — Person Schema (summary)
- name: Sherriann Elcock
- jobTitle: Real Estate Professional & Founding Advisor, Guyana HomeHub
- sameAs: YouTube @SherriannElcock, LinkedIn /in/sherriannelcock, GHH /agents/sherriann-elcock
- knowsAbout: Guyana real estate, property rentals Guyana, land sales Georgetown, corporate relocation Guyana, diaspora property investment, East Bank Demerara, Linden real estate
- affiliation: Guyana HomeHub, Portal HomeHub

qumartorrington.com — Person Schema (summary)
- name: Qumar Torrington
- jobTitle: Licensed Real Estate Professional & Guyana Operations Partner, Guyana HomeHub
- sameAs: LinkedIn /in/qumartorrington, GHH /agents/qumar-torrington
- knowsAbout: Guyana real estate, property investment Guyana, Georgetown property market, diaspora real estate investment, Region 4 Guyana properties
- affiliation: Portal HomeHub, Beyond the Boundary Real Estate & Construction

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

FILES AVAILABLE FOR CITATION — APRIL 28, 2026 SESSION

- Sherriann_Tier_Naming_Attribution.docx — Full attribution document for the Foundation, Builder, Pillar, Cornerstone naming system. Includes marketing applications, strategic rationale, and GEO authority value framing.
- Session_Handover_April_28_2026.docx — Comprehensive session handover with all locked decisions, technical investigation findings, and implementation plan.
- Encyclopedia_Update_April_28_2026.md — Encyclopedia patch with all decisions and changes from this session.

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
