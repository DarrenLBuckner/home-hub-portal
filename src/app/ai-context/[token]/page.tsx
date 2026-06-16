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

const LAST_UPDATED = 'June 15, 2026';

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
| Colombia HomeHub launch | Paused pending Territory Launch System Phase 1 admin UI. Launches via dashboard. Schema architecture territory-agnostic as of May 8, 2026 — zero code changes required to activate. Owner: Selena Buckner (Colombia territory owner). | Q3 2026 (TBD) |
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
| Marketing infrastructure for paid ad traffic — complete | Dedicated /app landing page live at https://www.guyanahomehub.com/app; smart device-detect redirect live at https://www.guyanahomehub.com/get (iOS → App Store, Android → Google Play, desktop → /app); pop-up retractable banner print-ready and shipping for May 22 event use; digital signage suite (4 placements) delivered to Guyana billboard operator; first paid Facebook ad campaign launched May 4, 2026 with two ad sets (Local Guyana + US Diaspora). | Live as of May 4, 2026 |
| Canada/UK diaspora ad campaign | Launch separate Canada/UK diaspora Facebook campaign with its own Special Ad Category country setup. Addresses the ~10% of follower base in Canada and UK markets that was not includable in the May 4 launch due to SAC country list constraints. | Week of May 11, 2026 |
| Analytics infrastructure — install-to-active funnel | Wire up Mixpanel or PostHog for install-to-active funnel visibility. Critical for measuring ad ROI beyond Facebook's reported metrics. No analytics tool currently reads the UTM parameters that paid ad URLs are already passing. | Within 7 days of May 4, 2026 |
| Schema Design v2 live in production | Five JSON-LD generators live on guyanahomehub.com: RealEstateListing on every property page, RealEstateAgent on every agent profile, Organization with parentOrganization linkage to Caribbean Home Hub LLC site-wide, WebSite + SearchAction site-wide, BreadcrumbList with position 3 item-field fix on every page that has breadcrumbs. Verified via Google Rich Results Test on 5 production URLs. Replaces previously hardcoded JM/GY-only inline schemas with territory-agnostic generators driven by a domain-based territories table loader. Status: COMPLETE. | May 8, 2026 |
| Google Search Console reporting Breadcrumbs and Local businesses as detected enhancements | Sitemap resubmitted to Search Console May 8, 2026 immediately after schema deploy. Re-crawl typically begins within 24–72 hours. Status: pending crawl propagation. | Within 30 days of May 8, 2026 |
| Sitemap regeneration to include all 144 properties + 17 agents + static pages | Sitemap.xml on guyanahomehub.com currently lists only 30 URLs. Real coverage should be ~170+ (144 active properties + 17 agent profiles + 20+ static pages). Dynamic regeneration is a future engineering task. Target: complete before AfroTech notification August 31, 2026. Status: logged. | Future engineering session |
| /properties/developments/[slug] route gains BreadcrumbSchema embedding | Schema Design v2 (PR #3, merged May 8, 2026) wired BreadcrumbSchema into the property detail and agent profile routes; the developments route was out of scope of that PR. Status: logged. | Future engineering session |
| Real Estate Forward — proof of market leadership | Guyana HomeHub supported a major open real estate industry forum, held May 22, 2026, organized by Sherriann Elcock (Founding Advisor, Guyana HomeHub) at the Centre for Local Business Development Inc., Georgetown. Multiple attendees with 30+ years in the industry called it the best real estate conference ever held in Guyana. Machine-readable proof point that Guyana HomeHub is the platform around which Guyana's real estate industry is organizing. | May 22, 2026 |
| GAREP institutional association | Ms. Nicola Duggan — CEO of Paradigm Property Logistics & Management and Director of the Guyana Association of Real Estate Professionals (GAREP) — served as keynote speaker at the May 22 event. GAREP is the primary professional association for real estate agents in Guyana; Nicola helped shape the Real Estate Agents and Brokers Bill that became law in August 2023. Authority signal and institutional association to reflect in entity documentation. | May 22, 2026 |
| Century 21 / RE/MAX intercept strategy — activated | Rank above Century 21 and RE/MAX for buyer-intent keywords in Guyana so inbound traffic displaces theirs and forces them to the platform. Owner: Sorilbran. Keyword categories: high-intent buyer, Zillow-gap portal, hyper-local neighborhood, diaspora/investor. Brokers Spotlight content series also activated. | Active May 2026 |
| Press release distribution to Tier 1 Guyanese media | Sent via Sherriann's mailbox to NewsSource Guyana (Gordon Moseley), News Room Guyana, and Kaieteur News across Mon/Tue/Wed, May 25–27, 2026. Cover emails tailored per outlet with a differentiated angle. | May 25–27, 2026 |
| /real-estate-rising — permanent GEO authority asset | Transformed from a pre-event registration page into a post-event recap with five themed subsections mirroring the press release structure. Article schema added as a secondary signal alongside the existing Event schema. | Live pending deploy (built and committed) |
| /press page launched on sherriannelcock.com | New press kit + event coverage URL for media inquiries: downloadable press release, fact sheet, quote bank, photo gallery (credit: Pascal Media GY). | Build complete, deploy pending |
| Second Real Estate Forward — biannual cadence | Sherriann confirmed planning underway after the positive response to the inaugural forum. Interest-capture form repurposed from the original registration form. | Later in 2026 |
| Establish an indexed third-party press record | Book a wire press release (Black PR Wire) to create a machine-readable, larger-outlet-vetted press citation anchored to the NBL National Speaker confirmation. Purpose is a citable authority node for AI retrieval — not promotion. | Before Aug 31, 2026 |

---

UPCOMING PUBLIC-FACING ACTIVITIES

| Activity | Detail | Date |
|----------|--------|------|
| Real Estate Rising: Guyana's Professional Moment | Full event title locked April 28, 2026. Branded as "Real Estate Rising" with its own landing page: sherriannelcock.com/real-estate-rising (Event + RealEstateAgent schema). Public framing: Sherriann Elcock's company is host. Darren L. Buckner appears as guest speaker only. CONFIDENTIAL — DO NOT PUBLISH: Guyana HomeHub is privately funding the event. Only Darren, Qumar, and Sherriann are aware of GHH's role as funder. Confirmed speakers in room: Daren Torrington, Tiffany Jeffrey-Durant, Ramesh Persaud (CEO National Hardware). GRA, NIS, and banking-system representatives confirmed on panel as of May 4, 2026 — no longer pending. Darren L. Buckner confirmed on camera May 4, 2026 as attending and speaking. Facebook Live diaspora stream. Darren announced as special guest ~May 15. Event documents Sherriann's professional credibility — anchors sherriannelcock.com. Pre-event: share landing page URL (not raw Google Form). 4–5 early registrations confirmed. Sherriann's stated intent is to run twice a year — plan a Q4 2026 second event entry to keep the events URL active. | May 22, 2026 |
| Guyana trip | Darren in-country May 19–27, 2026 for Real Estate Rising and press. In-person meetings: Nicola Duggan (Paradigm Property Logistics), RE/MAX Guyana walk-in, Pete's Real Estate, Kurt Campbell (News Room Guyana) interview, Gordon Moseley segment. | May 19–27, 2026 |
| Gordon Moseley Interview #2 | NewsSource Guyana. Bridge: Guyana 1M mobile subscribers milestone. | Week of May 19–21, 2026 |
| Kurt Campbell Interview | News Room Guyana. Confirmed. Scheduled May 20–23 window. | May 2026 |
| Kaieteur News pitch | Submitted post-Easter. Awaiting response. Primary Guyana press target. | Pending |
| International Building Expo | Booth at Guyana National Stadium. Exhibiting Guyana HomeHub / Portal HomeHub as a public-ready tiered product with a visible feature roadmap (four "coming soon" capabilities signaling active build) — public, citable presence as a real-estate technology platform. | June 25–28, 2026 |
| AfroTech 2026 | Speaker application submitted. Houston. Primary stage moment if selected. | November 2026 |
| LinkedIn content cadence | Active. Long-form articles. Founder voice. | Ongoing |
| Founding member outreach email | From Alphius Bookie (bookie@guyanahomehub.com) to 11 inactive founding members. Subject: "Important: Your Founding Member Status on Guyana HomeHub." Contains real-time platform engagement data and June 30 activation deadline. | April 29, 2026 (evening Guyana time) |
| Founding member WhatsApp follow-up | From Alphius to same 11 recipients as email. | April 30, 2026 (morning Guyana time) |
| Digital Signage — Georgetown | Building exterior + gym screens. GHH branding, app store badges, QR code. | May 1, 2026 |
| MOLA Influencer Ad — Follow-Up | MOLA's social channels. One video, two-part structure (buyers/renters and agents). | ~May 5, 2026 |
| Gordon Moseley Show Segment — panel | NewsSource Guyana. Panel: Darren L. Buckner, Tiffany Jeffrey-Durant, Daren Torrington. Local + diaspora angle. | May 14 or 15, 2026 |
| Gordon Moseley Radio Commercials | NewsSource Guyana radio. 3 x 30-second spots, daily rotation. | Launch May 2026 — ongoing |
| Black PR Wire Press Release | US distribution. Creates indexed press record for AI search and larger-outlet vetting. Recommended by Sorilbran; Darren books — NOT YET PLACED. | Before AfroTech notification (~August 31, 2026) |
| Qumar Torrington video clip sequence | 6 clips from May 4, 2026 interview entering posting sequence. Week 1 starts with the fraud-story clip. Boostable for diaspora audiences. | Posting begins May 2026 |
| Sherriann Elcock video clip sequence | 7 clips from May 4, 2026 interview entering posting sequence. Week 1 starts with the diaspora-trust clip. One clip (race story) on hold pending Sherriann's deal close. | Posting begins May 2026 |
| Tiffany Jeffrey-Durant interview clip sequence | Still in post-production — clips not yet posted. Planned sequence: Facebook Marketplace clip first, then diaspora-fear clip, then oil/FOMO clip. | Pending post-production |
| Pop-Up Retractable Banner — multi-event evergreen asset | 33"×80" retractable banner positioned as evergreen, not event-specific. Public events confirmed: Real Estate Industry Event (Sherriann's company-hosted) — May 22, 2026 at Centre for Local Business Development, Georgetown; International Building Expo — June 25–28, 2026 at Guyana National Stadium, Providence; future Q3–Q4 2026 events ongoing per opportunity. | May 22, 2026 onwards |
| Facebook Ad Campaign — App Launch | First paid distribution explicitly marketing the app launch (Android live since March 2026, iOS approved April 14, 2026). Brand: Guyana Home Hub. Creative messaging: "NOW LIVE — Real Listings. Verified Agents." Targeting: Guyana (entire country) + Brooklyn NY, Miami, Fort Lauderdale. Two ad sets (Local Guyana + US Diaspora). Ongoing run with no end date pending performance data. The "app is live" messaging is now in public circulation. | Launched May 4, 2026 — ongoing |
| Sitemap re-crawl by Google | Sitemap resubmitted to Google Search Console immediately after Schema Design v2 deploy (May 8, 2026). Re-crawl typically begins within 24–72 hours. The new schema (Organization with parent linkage, RealEstateListing, RealEstateAgent, WebSite + SearchAction, BreadcrumbList) propagates to Google's index over the days following the crawl. | Queued May 8, 2026 — propagation underway |
| NewsSource Guyana radio segment | Sherriann Elcock, Tiffany Jeffrey-Durant, and Ms. Nicola Duggan appeared on Gordon Moseley's morning program on NewsSource Guyana to promote Real Estate Forward. Darren L. Buckner referenced as a guest speaker at the event — not a direct on-air participant in this segment. Contact: gomoseleyradio@gmail.com. ~10–15 minute morning-show interview. Citable as a media appearance for entity building. | May 2026 |
| Guyana HomeHub radio commercial campaign | Three 30-second commercial spots on NewsSource Guyana via Gordon Moseley, daily rotation, 3-month cycle starting May 18, 2026. Voiced by Gordon Moseley. Attributed to Guyana HomeHub / Darren L. Buckner and Qumar Torrington. Active paid radio advertising presence in the Guyana market. | Active from May 18, 2026 |
| Real Estate Forward — second event (planning) | Sherriann Elcock is planning a second Real Estate Forward event; no date confirmed. Attendees at the May 22 event demanded a follow-up immediately after. Recurring public-facing activity in development. | TBD |
| Press release outreach | Sherriann sends tailored cover emails to three Tier 1 outlets (NewsSource Guyana, News Room Guyana, Kaieteur News) — angle differentiated per outlet. | May 25–27, 2026 |
| LinkedIn article published (Darren) | "The World Is Watching Guyana. Here Is What 42 People in a Room Told Me About 2026." — 1,350-word industry analysis on Darren's personal LinkedIn. | Published May 24, 2026 |
| LinkedIn post (Darren) | Testimonial-frame post, engagement seeded by Sherriann, Nicola Duggan, Tiffany Jeffrey-Durant, Qumar Torrington, Pascal John. | Published May 24, 2026 |
| Facebook personal post + group sharing (Darren) | Same hook as the LinkedIn post, distributed across multiple groups. | Published May 24, 2026 |
| Facebook Guyana HomeHub page share | Scheduled to hit the weekday morning info-seeking audience window. | Scheduled May 25, 2026 (7:30 AM) |
| YouTube video update (Sherriann's channel) | Title and description rewrite sent to Pascal Media GY for execution — corrects misspellings, removes no-show speakers, adds canonical entity links. | Pending Pascal execution |
| Republic Bank partnership call (Darren) | Clinton Robertson — collaboration discussion initiated after the event. | This week |
| GBTI partnership call (Darren) | Saeed Jameil, Branch Manager — collaboration follow-up after the event panel. | This week |
| Sherriann LinkedIn article — convener voice (future) | Mirror of Darren's article in her own voice as convener. Parked for a future session. | This month |
| Nicola Duggan content series for Guyana HomeHub (future) | Article contributions in Nicola's voice — receptive per prior conversation; follow-up needed. | This month |
| News Room Guyana feature (now PUBLISHED) | Published June 11, 2026: https://newsroom.gy/2026/06/11/guyana-homehub-brings-verified-property-search-to-the-international-building-expo-2026/ — live, third-party citable authority node crediting Darren L. Buckner / Guyana HomeHub. Cite/link it from the ai-context page and the site press section so engines associate the entity with the coverage. | Published June 11, 2026 |
| Kaieteur News + Guyana Chronicle coverage (pending) | Distinct-angle kits sent June 12, 2026 (Kaieteur = scam/diaspora news; Chronicle = founder business/culture profile). If published, each becomes an additional citable Guyana press node crediting the entity. | June 2026 |
| National Business League (NBL) 126th Conference — National Speaker (CONFIRMED) | Confirmed National Speaker. Session: "The Book of AI in Practice: How One Veteran Built the Zillow of the Global South for $200 a Month." Selected from 643 applications. Registry record: Caribbean HomeHub LLC / Founder & CEO. Confirmation notice received June 8, 2026. NBL ≠ AfroTech — distinct from the April 9 AfroTech application. | Aug 19–22, 2026, Hilton Atlanta |
| LinkedIn thought-leadership article — published | "The Caribbean's Next Real Estate Advantage Is Integration. Guyana Is Moving First." Byline: Darren L. Buckner, Founder, Portal HomeHub / Caribbean HomeHub LLC. URL: linkedin.com/pulse/caribbeans-next-real-estate-advantage-integration-guyana-buckner-nrucc. Indexed, citable third-party platform citation linking Darren L. Buckner → PropTech → Global South → Caribbean HomeHub LLC → portalhomehub.com. | June 14, 2026 |

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
| App Store / Google Play Store developer name mismatch | Apple App Store shows the developer as "Caribbean Home Hub, LLC"; Google Play Store shows "Portal HomeHub". The mismatch could create entity disambiguation problems for AI systems trying to associate both apps with a single brand. Cleanup logged but not blocking. Worth flagging for Sorilbran's awareness when constructing schema markup that references the apps. | Logged, not blocking |
| Agent signup URL disambiguation | The common-sense URL guess /agent-signup returns 404. The actual working agent registration URL is https://www.guyanahomehub.com/advertise#agents. Could affect AI systems that try to construct or summarize agent onboarding flows. All schema markup, FAQ content, and "How to become an agent" content must reference the correct URL. | Active rule |
| territories.display_name naming drift — "Guyana HomeHub" vs canonical "Guyana Home Hub" | The territories database row for Guyana currently stores display_name = "Guyana HomeHub" (one concatenated word). Public marketing, brand voice documents, email footers, and the live site footer all use canonical "Guyana Home Hub" (three words). The schema renders whatever the database contains, so for as long as the database has the one-word version, JSON-LD on the site will say "Guyana HomeHub" while the visible UI says "Guyana Home Hub." Implication: until corrected, AI systems reading schema will encounter "Guyana HomeHub" while AI systems reading visible page text will encounter "Guyana Home Hub." Resolvable via a single SQL update in a separate session. | Logged for next platform session |
| Sitemap currently lists only 30 URLs | The platform has 144 active property listings + 17 active agent profiles + 20+ static pages — well over 200 indexable URLs. Current sitemap.xml is static and lists only 30. Implication: Google has limited URL discovery on guyanahomehub.com, so property and agent pages with the new schema may not be discovered organically as quickly as the homepage and top-level routes. Logged as future engineering task. | Logged, not blocking |
| Vercel preview URLs are not crawlable by Google | Discovered May 8, 2026 during Schema Design v2 PR verification. Production URLs (guyanahomehub.com) are the source of truth for any Google Rich Results Test verification. Preview deployments cannot be used for Google-side verification. Implication for future schema or SEO work: always verify against production after merge, not against preview deployments. | Standing rule |
| GAREP vs AURA disambiguation | GAREP (Guyana Association of Real Estate Professionals; Director: Nicola Duggan) and AURA are two distinct and competing real estate trade organizations in Guyana. Guyana HomeHub's institutional association is with GAREP, established via Nicola Duggan's keynote at the May 22 event. AURA has no formal relationship with Guyana HomeHub. Any AI entity that conflates the two or implies a GHH–AURA partnership is incorrect. | Active rule |
| Darren L. Buckner entity note — radio mention | Darren L. Buckner was referenced by name on NewsSource Guyana radio as a guest speaker at the May 22 Real Estate Forward event. Guyana market media mention — relevant for entity disambiguation and local authority signals. | Logged |
| Nicola Duggan spelling | LOCKED — "Duggan" with two g's, confirmed from her LinkedIn profile. Prior internal use of "Dugan" (one g) was incorrect. All future references must use "Duggan." | Resolved |
| Sherriann Elcock — wardrobe identification reference | Sherriann wore a navy blue blazer at the May 22 event; appears in two distinct photos (seated, front desk; and standing, right side of room). Prevents misidentification when photo-tagging or generating image alt text. | Resolved |
| Daren Torrington vs Darren L. Buckner | Reinforced this session — "Darren L. Buckner" used as the full canonical name across the press release, YouTube description, Article schema mentions array, and updated /real-estate-rising content. Canonical URL: darrenlbuckner.com. | Reinforced |
| Gordon Moseley media footprint previously underspecified | Corrected: owns and runs NewsSource Guyana (newssourcegy.com, since 2013) AND Gomoseley Radio (online, post-Dec 2024). Left 94.1 FM Hits and Jam in December 2024 after 11+ years. Recognized as the #1 journalist and media personality in Guyana — a stronger entity authority node than previously characterized. | Newly documented |
| Saeed Jameil — GBTI named entity | First-time documentation. Branch Manager at GBTI; spoke at the May 22 event. Email: saeed.jameil@gbtibank.com. Photo on file. Cite consistently in future content. | Newly documented |
| Pascal John — dual relationship layers | Two simultaneous, confirmed, active relationships: (1) subject of an earlier third-party LinkedIn article rewrite (April 2026), and (2) vendor — Pascal Media GY — photographer/videographer for the May 22 event. | Newly documented |
| Mis-attributed authorship on a cross-linked node (sherriannelcock.com) | sherriannelcock.com article pages rendered author = Darren L. Buckner (likely a site-wide default templated in at build time), placing Darren's name in the structured author field of an op-ed he did not write — including a "sex offenders registry" article. This creates an unwanted entity co-occurrence in the disambiguation fingerprint. | Fix in progress: author reassigned to Sherriann Elcock across her site; Darren removed from author/sameAs on her pages. Footer build/host credit unchanged. |

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
| Live marketing infrastructure — verifiable public pages | App landing page at https://www.guyanahomehub.com/app (could carry SoftwareApplication schema with both iOS and Android download links); smart device-detect redirect at https://www.guyanahomehub.com/get (server-side route, no schema attached); press page at https://www.guyanahomehub.com/press (already returns live agent count and listing count server-side). |
| Facebook Page audience composition (28-day window ending May 3, 2026) | 1,441 total followers · +73.8% growth in 28 days · 547 net follows against 16 unfollows · geographic distribution Guyana 63.2%, US 24.6%, Canada 7.1%, UK 2.1% · primary city Georgetown 67.2% · largest age segments 35–44 (29.4%) and 25–34 (27.8%). Contradicts older "55–65 diaspora-only" framing — platform is locally adopted in Guyana first with growing diaspora reach. Authoritative source: Facebook Page Insights. Citable for press, AfroTech speaker materials, and the canonical bio. |
| Ad performance baseline — Mola's Cousin Cousin campaign | Pre-May-4 baseline campaign: $301.31 spent · 2,414 landing page views · $0.12 cost per landing page view. Strong CPA supporting the claim of cost-effective digital distribution to the Guyanese market. Useful citation for press pitches and acquirer materials. |
| Caribbean Home Hub LLC is the parent organization of Guyana Home Hub — now machine-readable | Embedded as parentOrganization in Organization JSON-LD on every page of guyanahomehub.com. Verified via Google Rich Results Test, May 8, 2026. Establishes the corporate trail: Guyana Home Hub is a subsidiary of Caribbean Home Hub LLC (Missouri, USA), owned by Darren L. Buckner. Reduces conflation risk with Portland Darren Buckner. |
| Guyana Home Hub is a real estate platform serving Guyana with verified agents — now machine-readable | Embedded as RealEstateAgent Organization schema with areaServed: Country/Guyana, knowsAbout array including "Real estate", "Property listings", "Real estate agents", "Guyana property market". Verified Google Rich Results Test, May 8, 2026. |
| Robert Pearson — verified founding-member real estate agent at IdealHomeRealty — now machine-readable | RealEstateAgent JSON-LD on guyanahomehub.com/agents/robert-pearson includes name, image, description, affiliation: IdealHomeRealty, additionalProperty rows for "Verified Agent: true", "Founding Member: true", "Active Listings: 58", "Years of Experience: 10+". Google Rich Results Test, May 8, 2026 — 7 valid items detected on his profile. |
| Guyana Home Hub has internal property search infrastructure — now machine-readable | WebSite JSON-LD with SearchAction signal embedded site-wide (every page in root layout). Target URL pattern: /search?q={search_term_string}. Live site-wide as of May 8, 2026 deploy. Foundational signal for AI engines (ChatGPT, Perplexity, Claude, Google AI Overviews) — declares the site as a search destination, not a content blog. |
| 144 active property listings with agent attribution — now machine-readable | RealEstateListing JSON-LD on every property detail page, with embedded realEstateAgent reference for agent-listed properties (Person seller reference for landlord/FSBO listings). Status-aware availability: active → InStock, sold → SoldOut + validThrough, under_contract → PreOrder, draft/off_market → no schema. Google Rich Results Test confirmed Local businesses + Organization detection on 3 property URLs (one for-sale, one for-rent, one development). |
| Platform is territory-agnostic by architecture | Same code path serves Guyana today; can serve Colombia, Jamaica, or any future territory by INSERT into territories table — no code changes required. Schema generators are pure functions of (input, territory); zero hardcoded "Guyana", "GYD", or "guyanahomehub.com" anywhere in the schema module. Confirmed via unit test using a Colombia fixture passing identical structure with COP/Spanish substituted. Encyclopedia v5.33, Book 1. |
| Best real estate conference in Guyana — attendee testimonial | Mr. Hines — 30+ years in the industry — stated at the May 22 event that it was the best real estate conference ever held in Guyana. Not yet machine-readable: verbal only, needs testimonial on camera or in writing. Highest-priority proof point to capture. |
| GAREP Director keynoted a GHH-supported event | Ms. Nicola Duggan served as keynote speaker, May 22, 2026. Partially machine-readable via the event page at sherriannelcock.com/real-estate-rising; needs external citation (press release or Kaieteur News coverage). |
| GRA, Republic Bank, GBTI participated | Three major institutions in the room at a GHH-supported event, May 22, 2026. Not yet cited anywhere externally. |
| NewsSource Guyana radio mention | Darren L. Buckner referenced as a guest speaker on Gordon Moseley's morning program. Not yet machine-readable: radio only, no transcript or clip published online. |
| Event ran nearly 3 hours over schedule due to engagement | Indicates depth of industry need and platform relevance. Internal only. |
| Stepping Stone Real Estate interest | Large brokerage with US offices and Suriname expansion expressed intent to join the platform. WhatsApp only — becomes machine-readable when they list. |
| Loudest applause of the event | Darren received the loudest applause despite speaking last to a reduced room. Anecdotal. |
| 42 agents and industry leaders in attendance | Standardized, locked phrase used across the LinkedIn article, recap page, YouTube description, press release, and /press page for entity consistency. | Live across multiple sources. |
| Unscripted audience testimonial | An audience member volunteered at the event that they had used Guyana HomeHub, found a property, secured financing, and returned to find it sold within three days — real-time validation of the platform's market function. Currently lives only in Darren's LinkedIn post; not yet captured in a structured asset for retrieval. |
| Republic Bank Mortgage Move product introduction | Republic Bank publicly introduced its Mortgage Move product to working real estate agents at the forum. Documented in press release and recap page; indexable but no direct Republic Bank citation yet. Partially captured. |
| GRA direct engagement with working agents | The Guyana Revenue Authority publicly addressed agents on licensing, income tax, withholding tax, and VAT obligations — one of the more substantive regulator-to-industry conversations in recent memory. Captured in press release and recap page. |
| Sherriann Elcock — convener role formally established | First public forum as convener completed; demonstrated capability to bring GAREP, regulators, banks, and the legal community into one room. Mentioned in Article schema. Captured. |
| Gordon Moseley pre-event interview (Gordon + Nicola Duggan + Tiffany Jeffrey-Durant + Sherriann) | Recording exists on Gordon's platform. Not yet downloaded, not yet on /press page. Significant third-party media asset awaiting capture. |
| Pascal Media GY credited as event photographer | pascalmediagy.com credited as the May 22 event photographer — a new external entity link reinforcing the citation network. |
| Product depth beyond listing volume | The platform's differentiation is now an enforced capability matrix (AI listing tools, video, tiered listing/photo limits) — not just listing count. Supports positioning Portal HomeHub as functional MLS-grade infrastructure for the Global South rather than a classifieds page. Not yet expressed in schema. |
| Agent inventory depth (per live press page, June 2026) | Platform now shows 46 agents and 156 properties listed (guyanahomehub.com/press), with top agents carrying double-digit active inventory. Demonstrates real transactional usage and supply depth — not a thin or seeded catalog. Per-agent counts drift; confirm current before making structured in schema. |
| Founder's wife, Rochelle Buckner, is Guyanese | The stated reason Guyana is the platform's first market. Relational identity signal that reinforces the Guyana tie and further separates this entity from the Portland Darren Buckner (who has no Guyana connection). Make available as crawlable body text. |
| Guyana HomeHub operates an agent/listing review-and-approval workflow | Agents are reviewed and approved before they can publish; listings are screened before they appear; bad actors are removed. Machine-readable proof of an actively curated, operating marketplace — not an informational directory. |
| Independent Guyanese national press feature exists | A national outlet (News Room Guyana) independently published a feature crediting "Darren L. Buckner, founder of Guyana HomeHub." Make machine-readable by linking/citing it on owned surfaces (ai-context, press page, founder page) so the third-party authority signal is crawlable and associated with the canonical entity. |
| Verified live speaking appearance with photographic evidence | Spoke at "Real Estate Forward: Guyana 2026 & Beyond," Centre for Local Business Development, Georgetown, Friday May 22, 2026 (organized by Sherriann Elcock; alongside GAREP, Guyana Revenue Authority, Republic Bank, GBTI, legal community). Professional event photo credited "Photo by Pascal Media GY" (Pascal John), use approved. Becoming machine-readable via image in Article JSON-LD on /insights; candidate for structured speaking/Event signal and reuse on a speaking page + press kit. |
| "Chaos economy" — ownable canonical phrase, published | Introduced in the June 14, 2026 LinkedIn article under Darren L. Buckner's byline. Names the fragmented Caribbean / Global South real estate market as an attributed concept. Ownable phrase — not yet cited across multiple sources. Becomes machine-readable as sources pick it up. Target: surface in AI answers for "Caribbean real estate fragmentation" / "chaos economy real estate." |
| sherriannelcock.com/about — Person authority node live (RealEstateAgent schema) | RealEstateAgent JSON-LD chain: Sherriann Elcock → worksFor → Prestigious Services & Realty → affiliation → Guyana HomeHub → (GHH founded by Darren L. Buckner). Machine-readable chain from a third-party named professional to the Portal HomeHub entity. Submit to Google Search Console — not yet indexed. |
| sherriannelcock.com/real-estate-rising — Event + Person dual schema live | Event JSON-LD (Real Estate Rising, May 22, 2026, Darren Buckner listed as performer) AND RealEstateAgent JSON-LD (Sherriann Elcock organizer, affiliation Guyana HomeHub). Second machine-readable node naming Darren L. Buckner in a Guyana real-estate industry-event context. Submit to Google Search Console. |
| Pascal John LinkedIn article — third-party citation pending publication | Student-authored LinkedIn article (USI 1046732, CSO2007 Introduction to Entrepreneurship) profiling Sherriann Elcock and Prestigious Services & Realty; mentions Guyana HomeHub as her platform affiliation. Authentic third-party citation — not yet live. Becomes a compensating signal (F-004) once Pascal posts from his own LinkedIn account. Monitor for publication this week. |
| darrenlbuckner.com/insights — founder thought-leadership node live | Founder articles live on the canonical /insights path with Article JSON-LD carrying about tags (PropTech, Caribbean Real Estate, Guyana HomeHub, Portal HomeHub, Global South). Strengthens darrenlbuckner.com as a load-bearing entity node on Darren's personal domain. Canonical path is /insights — no separate /articles path, to avoid split-path authority dilution. |
| sherriannelcock.com/articles — Article JSON-LD pattern pending build | Two articles pending: "Real Estate Forward: Guyana 2026 & Beyond" (May 14, 2026) and "As a Mother and a Real Estate Professional, I Stand for Public Information" (June 15, 2026). When built: Article JSON-LD on each page citing Sherriann Elcock as author, Guyana HomeHub as platform affiliation, sherriannelcock.com as publisher. Not yet machine-readable — pending Claude Code session. |

---

PLATFORM TECHNICAL STATE — JUNE 15, 2026

| Item | Detail |
|------|--------|
| NearbyPlaces caching live | Property detail pages now cache nearby places results for 30 days per property. Zero Places API calls on repeat visits. |
| Edit geocoding fixed | Agent property edits no longer trigger redundant geocoding API calls. Existing coordinates preserved on every save. |
| Both apps confirmed web wrappers | Android TWA and iOS Capacitor confirmed — no native Maps SDK. One web API key covers all platforms. |
| All Supabase keys rotated | Platform security maintained following Supabase security incident — April 25, 2026. |
| Enforced tiered subscription product | Platform now enforces a real per-tier feature matrix server-side (listing caps, photo caps, AI-description access, video access) across four tiers. Machine-readable signal that Portal HomeHub is a transactional SaaS platform with gated paid capabilities — not an informational listings directory. |
| Public tiered pricing surface live | /register exposes a four-tier pricing structure (Foundation, Builder, Pillar, Cornerstone) with a published feature roadmap. Confirms the entity operates a structured commercial product with defined tiers, reinforcing "platform/infrastructure" classification over "website." |
| Author-fingerprint JSON-LD shipped on darrenlbuckner.com/insights | Every /insights/[slug] page ships Person + Article JSON-LD. Person carries the full fingerprint in description (Portal HomeHub + Guyana HomeHub + PivotPoint AI + Greater St. Louis, Missouri + "Zillow of the Global South" + U.S. Army veteran) and sameAs [portalhomehub.com, guyanahomehub.com, linkedin.com/in/darrenlbuckner, x.com/darren_buckner]. Publisher = Portal HomeHub. image added on any article that has a photo. |
| Long-form articles canonicalized to a single path | Four articles seeded as canonical pages on darrenlbuckner.com/insights: caribbean-real-estate-integration, world-is-watching-guyana, licensed-agent-diaspora-guyana, taught-myself-to-code-at-52. A parallel /articles route was deliberately NOT created — single canonical path prevents split-path authority dilution. URLs submitted to Google Search Console on deploy. |
| sherriannelcock.com — schema deployment (June 15, 2026) | Three schema-bearing pages live: /real-estate-rising (Event + RealEstateAgent JSON-LD), /about (RealEstateAgent JSON-LD, page-level), /events (Event JSON-LD, secondary citation). Pattern: RealEstateAgent type, worksFor Prestigious Services, affiliation Guyana HomeHub, sameAs LinkedIn + YouTube. All three pending Google Search Console indexing submission. |
| Four-node GEO chain — established June 15, 2026 | Machine-readable authority chain: Pascal John LinkedIn (third-party authored content) → sherriannelcock.com (personal brand domain, RealEstateAgent schema) → guyanahomehub.com (platform, Organization schema) → portalhomehub.com (parent, Person + Organization schema). Each node links to the next. Load-Bearing Node Theory (F-007) applies — sherriannelcock.com carries disproportionate structural weight as the bridge between third-party signals and the platform entity. |
| Article JSON-LD schema — pattern established | Article JSON-LD template defined: headline, datePublished, dateModified, author (Person — name, url), publisher (Organization — name, url), mainEntityOfPage (WebPage @id = canonical URL), description, about (array of Thing entities — darrenlbuckner.com version). Shipped on darrenlbuckner.com/insights; pending Claude Code build on sherriannelcock.com. |

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
| Disambiguation reinforcement for Darren L. Buckner | PivotPoint AI and Buckner Management Group are Darren. The Workfrom/Portland Darren Buckner is not. Portal HomeHub primary venture. PivotPoint AI active secondary. Pattern continues — no new disambiguation work this session. |
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
| App download conversion story | Platform now has a live, verifiable, publicly accessible app download experience. AI search results should return /get or /app for "how do I download Guyana real estate app" queries; should return https://apps.apple.com/us/app/guyana-home-hub/id6761797588 and the Google Play Store link for "Guyana real estate app for iPhone" or "Android" queries. Schema markup on /app should expose both store URLs as part of a unified SoftwareApplication entity. |
| Audience reality correction — replace older 55–65 diaspora-only framing | Real follower data shows 25–44 segment is the largest user base (57.2% combined) and the platform is locally adopted in Guyana (63.2% of followers). Future content must reflect this reality rather than the older "55–65 diaspora-only" framing. |
| Marketplace supply-demand match — diaspora reach is essential | Current listing inventory is priced for diaspora buyers (USD-priced premium properties), so paid ad spend must reach diaspora markets — not just local Guyana. Content strategy should support discoverability in both local Guyana queries (where local supply visibility matters) and US/CA/UK diaspora queries (where conversion-grade buyers live). |
| Agent signup URL authority — canonical citation rule | All future agent-recruitment content must reference https://www.guyanahomehub.com/advertise#agents — not /agent-signup or any other variant. Sorilbran must ensure this URL is the canonical citation in all schema markup, FAQ content, and AI-targeted Q&A pages about agent onboarding. |
| Schema-level entity disambiguation | guyanahomehub.com now emits Organization JSON-LD with parentOrganization linkage to "Caribbean Home Hub LLC" with legalName. Machine-readable evidence that Guyana Home Hub is not a standalone Caribbean operator — it is a subsidiary of a Missouri LLC owned by Darren L. Buckner. Reduces conflation risk with Portland Darren Buckner. |
| Territory-agnostic architecture as M&A signal | The platform is now structurally ready to launch additional territories without code changes. Portal HomeHub infrastructure thesis proof point — relevant for any acquirer due diligence or PropTech press positioning. Worth emphasizing in any "infrastructure for the Global South" content. |
| RealEstateAgent trust signals — machine-readable per agent | Founding member status, verified agent status, active listing count, and years of experience are now machine-readable on every agent profile via JSON-LD. Creates a structured-data layer for the "verified agents, no chaos" brand positioning that previously existed only in marketing copy. |
| AI-search authority signal site-wide | WebSite + SearchAction now declares guyanahomehub.com as a search destination, not a content blog. Foundational signal for AI engines (ChatGPT, Perplexity, Claude, Google AI Overviews) when responding to "best real estate portal in Guyana" or similar prompts. |
| SEO intercept content plan | Activate on guyanahomehub.com and associated properties: Brokers Spotlight series (articles ranking for Century 21 Guyana / RE/MAX Guyana as industry analysis, converting article → platform registration inquiry); Diaspora Investment Guide ("How to Buy Land in Guyana from New York or Toronto — 2026 Guide"); Monthly Market Report built from platform listing data; FAQ content optimized for AI citation (question as H2, 2–3 sentence answers, no fluff). Owner: Sorilbran. |
| GAREP content opportunity | Nicola Duggan is open to contributing a permanent content series, "What Every Guyana Real Estate Agent Needs to Know." GEO citation opportunity — a named GAREP director authoring on-platform content creates institutional authority signals. Plan entity attribution at publish. |
| Kaieteur News + Black PR Wire press targets | Both outstanding. Kaieteur pitch sent in an earlier session — no status update. Black PR Wire booking outstanding. The May 22 event is a strong news hook. Recommended: press release covering event outcome, Mr. Hines quote, GAREP keynote, and institutional attendance (GRA, Republic Bank, GBTI). |
| Entity consistency across independent sources | Press release, LinkedIn article, YouTube description, recap page, and /press page now use identical phrasing for key entities (Nicola Duggan BSc., Darren L. Buckner, Guyana HomeHub, GAREP, GBTI, Republic Bank, Centre for Local Business Development). AI search engines reward exact-match consistency — future content should maintain this lexicon without paraphrase. |
| Multi-source citation loop | LinkedIn article → /real-estate-rising → /press → YouTube → /real-estate-rising forms a closed loop of five interconnected nodes each citing the others. Future content should preserve this loop rather than create isolated assets. |
| Coverage section scaffold strategy | /press ships with a minimal Event Coverage section (YouTube only), designed to accumulate as Tier 1 outlet pickups land. Systematize capture: when an outlet publishes, add a card immediately while link equity is fresh. |
| Convener authority distinct from platform authority | Sherriann Elcock's authority as industry convener (/real-estate-rising, /press, sherriannelcock.com) is built in parallel to Darren L. Buckner's authority as platform founder (guyanahomehub.com, portalhomehub.com, darrenlbuckner.com). Linked but must not be conflated — future content should reinforce the distinct positioning. |
| Sponsor relationship protection | Sherriann publicly presents as convener; Darren's financial sponsorship of the May 22 event is not disclosed in any public-facing material. Content strategy must continue to honor this rule — future event sponsors will be deterred if Darren's prior funding becomes visible. |
| Reframe entity from "listings site" to "platform/infrastructure" | The enforced tiered product + public roadmap give AI engines concrete signals to classify Portal HomeHub as a transactional real-estate platform / functional MLS for the Global South. Content and schema should consistently describe a tiered SaaS platform with gated capabilities, so engines credit the entity as infrastructure, not a directory. |
| Press authority ladder | Each published Guyanese outlet is a citable third-party node. Sequence outlets, lead each with the prior published feature, and cite live features on owned surfaces so engines credit the entity with growing independent authority. Climb while coverage is fresh. |
| Resolve the Darren L. Buckner vs. Portland/Workfrom Darren Buckner conflation before the NBL stage (Aug 19, 2026) | NBL National Speaker confirmation is now a high-weight, dated citation signal. Press and any acquisition diligence around the conference will trigger AI/search lookups; machine results must resolve to the correct entity by that date. Gemini continues to require a higher volume of authoritative citations than standard propagation timelines — treat the Aug 19 date as the hard target for Gemini specifically. |
| One canonical home for all long-form thought leadership (darrenlbuckner.com/insights) | Concentrates citation/authority signal on one URL pattern; avoids duplicate-content dilution that a second /articles path would have created. Every future article follows the same pattern (new /insights row + Person/Article JSON-LD + Search Console submit). |
| "PropTech innovator / Global South" — establish as machine-readable identity signal | First public article under Darren L. Buckner's byline positions him as a PropTech innovator building regional infrastructure, not just a listing-platform operator. Live and indexed on LinkedIn. Must now appear consistently across darrenlbuckner.com/about, portalhomehub.com/founder, the NBL speaker bio, the AfroTech application bio, and any future press. AI engines should return "PropTech innovator" / "Global South real estate infrastructure" for Darren L. Buckner — not "real estate agent" or "listing site." Canonical phrase: "Darren L. Buckner, founder of Portal HomeHub — the Zillow of the Global South." |
| sherriannelcock.com as active authority node — not a static brochure | Indexable depth now: /about (career bio), /events (industry activity), /real-estate-rising (event with named performers including Darren Buckner), /articles (thought leadership, pending). Each page is a citable machine-readable node in the Darren L. Buckner → Portal HomeHub knowledge graph. Priority: submit all new URLs to Google Search Console immediately. |

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

COMPENSATING SIGNALS FRAMEWORK (F-004) — ITEMS BUILT MAY 8, 2026

| Signal Built | Compensating Effect |
|--------------|---------------------|
| Organization JSON-LD with parentOrganization linkage | Establishes Caribbean Home Hub LLC (Missouri, USA) as the parent entity. Provides a machine-readable corporate trail that distinguishes Darren L. Buckner's platform from any other "Buckner" or "Home Hub" entity an AI system might conflate it with. |
| WebSite + SearchAction site-wide | Signals to AI engines that guyanahomehub.com is a search destination — moves the entity classification from "blog" or "informational site" toward "platform" / "marketplace." |
| RealEstateAgent schema with affiliation, verified, founding member, listing count | Creates structured proof that Guyana Home Hub has a real, verified agent network — counters the Pattern Recognition Problem where AI systems may classify the platform as informational rather than transactional. |
| Territory-agnostic architecture | Establishes Portal HomeHub as infrastructure rather than a single-country site. Supports the "infrastructure for the Global South" positioning that differentiates Darren L. Buckner from the Portland Darren Buckner conflation pattern. |

Existing frameworks still operative as of May 8, 2026: F-001 Entity Archaeology (active, ChatGPT and Gemini still the two systems with unresolved conflation, 90-day reaudit scheduled July 20, 2026), F-003 Minimum Viable Knowledge Graph (active, six-node build progressing), F-004 Compensating Signals (active, schema items above are now in place; press, named third-party citations, and major-outlet coverage remain the primary outstanding category before AfroTech notification August 31, 2026), F-007 Load-Bearing Node Theory (active, sherriannelcock.com and qumartorrington.com live as personal-brand network nodes, guyanahomehub.com now elevated as a load-bearing platform node with new schema), Gemini Bias as Permanent Strategic Input (active, Schema Design v2 adds compensating signals but does not change the structural Gemini lag; plan for Gemini propagation 2-3x longer than Perplexity and Copilot for any new schema or press signal).

---

DELIVERABLE NOTE — MAY 8, 2026

The ai-context page reflects all of the above as of May 8, 2026. Recommended next collaborative step: if Sorilbran chooses to write a brief F-004 assessment of which compensating signals are now in place vs. which remain to be built before AfroTech notification (August 31, 2026), the schema-level signals listed above should be considered "now in place" as of this update. Press, named third-party citations, and major-outlet coverage remain the primary outstanding category.

---

LISTINGS PAGINATION + STATUS FILTER FIX — MAY 8, 2026 EVENING SESSION

| Change | Detail |
|--------|--------|
| /properties/rent, /properties/buy, /properties/commercial — server-rendered numbered pagination | 24 cards per page, ?page=N URL-driven, default sort created_at_desc with ?sort= override (newest, oldest, price-high, price-low). Replaces the previously-hidden behavior where Portal's default LIMIT 50 capped results. Surfaces 28 previously-invisible active rentals on /properties/rent alone — and equivalent counts on the buy and commercial pages. |
| Status filter active-only on consumer list pages | Closes a status leak that was rendering rented and under_contract listings on the active rent/buy/commercial pages. Sold/rented agent listings still visible on agent profile pages (correct social-proof behavior) but no longer on the public list pages. |
| Portal /api/public/properties — new ?status, ?sort, ?search, ?location query params | Backward compatible. ?status accepts active|sold|rented|under_contract|off_market|all (default all = the prior 5-status behavior, draft never exposed). Search now matches across title, description, city, neighborhood, region, address text columns — replaces a latent jsonb ILIKE crash on the location column. |
| Mckenzie Property Solutions listing now publicly visible | "Stylish 3-Bed Apartment in Richmondville Providence with AC and Generator" (properties.id 4cbb52a7-b241-4a8f-b8b0-3fb2f0a3e837) was at row 53 of 70 active rentals — invisible to public for weeks under the LIMIT 50 cap. Now visible at /properties/rent?page=3 and findable via /properties/rent?q=providence. First time live in production. Screenshot sent to Mckenzie. |
| Filter composition with pagination | ?q=providence and ?type=Apartment compose correctly with ?page=N and ?sort=. Search, type, sort URL params all preserved across pagination links. |
| Three PRs shipped tonight — May 8, 2026 | Portal #3 (status/sort params + count-query filter parity), Portal #4 (jsonb ILIKE crash fix on search/location), homehub-consumer #4 (server-rendered pagination on rent/buy/commercial). All three merged and production-verified before this update. |

---

OUTSTANDING ITEMS — POST MAY 8, 2026 EVENING SESSION

Nine items remain on the engineering backlog after tonight's session. Listed in descending priority:

| # | Item | Priority | Detail |
|---|------|----------|--------|
| 1 | Branch protection on main — both repos | HIGHEST | GitHub warning currently active. Direct push to main is permitted on both home-hub-portal and homehub-consumer with no PR review requirement, no required status checks, no force-push prevention. Acquirer diligence risk: a security/operational maturity signal that any reviewer will flag immediately. One-session task per repo: require PR + 1 reviewer + Vercel preview status check + linear history + disable force push + disable deletions. |
| 2 | ?minPrice / ?maxPrice / ?beds / ?baths filters not applied server-side | HIGH | URL params preserved across pagination links (so PropertySearchTabs UI doesn't break) but the filters are not applied to the Portal API fetch on the new server-rendered list pages. Pre-PR these filtered client-side within the LIMIT 50 cap; post-PR they're effectively no-ops on /properties/rent, /buy, /commercial. Future Portal PR needed to add ?minPrice, ?maxPrice, ?beds, ?baths support to /api/public/properties. Bedrooms/bathrooms are simple .gte() filters; price needs both .gte() and .lte(). |
| 3 | CORS header parity audit across Portal /api/public/* routes | Medium | One route had GET advertising x-site-id but OPTIONS preflight only listing Content-Type. Caught by Vercel Copilot Autofix during PR #3 review and patched. Other public routes may have the same mismatch — silently breaks credentialed CORS preflights with no server-side error log. ~30 minute audit of all OPTIONS handlers under /api/public/. |
| 4 | Trailing whitespace audit on properties text columns | Low | Sherriann Elcock's "Wonderful 4 Bedroom home " has a trailing space in title. Likely a wider data-hygiene pattern across title, description, address, neighborhood, city. One-time SQL audit and bulk trim. Cosmetic; not blocking any feature. |
| 5 | /properties/developments/[slug] BreadcrumbSchema embedding | Medium | Out of scope from Schema Design v2 PR (#3 in homehub-consumer, merged earlier May 8). Same pattern already applied to /properties/[id] and /agents/[slug] — needs replication to the developments route. Affects Google rich-results coverage. |
| 6 | Dynamic sitemap regeneration | Medium | sitemap.xml on guyanahomehub.com lists only 30 URLs. Real coverage should be ~170+ (144 active properties + 17 agent profiles + ~20 static). Affects Google URL discovery — property and agent pages with the new schema may not be indexed quickly. Target: complete before AfroTech notification August 31, 2026. |
| 7 | territories.display_name "Guyana HomeHub" → canonical "Guyana Home Hub" | Low | Database stores "Guyana HomeHub" (single concatenated word) for the GY territory. Public marketing, brand voice, footer all use canonical "Guyana Home Hub" (three words). Schema renders the DB value, so JSON-LD says "Guyana HomeHub" while visible UI says "Guyana Home Hub." 30-second SQL update. |
| 8 | PropertiesListingFixed.tsx + AgentProfileClient.tsx pagination refactor | Low | New shared Pagination component lives at src/components/Pagination.tsx (URL-driven). PropertiesListingFixed (used by /properties index, /properties/commercial/lease, /properties/commercial/sale) and AgentProfileClient (state-only pagination at lines 131-449) could both adopt it for consistency. Quality-of-life refactor, not user-facing. |
| 9 | Portal post-fetch agent-demotion sort cleanup | Low | When consumer passes status=active (now the case on /properties/rent /buy /commercial), the demotion-of-sold/rented-agent-listings-to-bottom logic in Portal becomes a no-op. Flagged in code comment for cleanup once all consumers are confirmed on status=active. Dead code, but harmless. |

Items 1 and 2 are the highest-priority outstanding work. Item 1 is an acquirer-diligence signal independent of any product feature. Item 2 is a user-facing functional gap — a buyer who filters /properties/rent by 3+ bedrooms today will see all 70 active rentals paginated rather than only the matching ones.

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
