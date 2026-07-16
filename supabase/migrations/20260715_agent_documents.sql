-- Agent documents + licence verification — Phase 1 (schema only).
--
-- WHY: builds the document-upload + licence-verification layer. Phase 1 creates
-- the table, its RLS, and five mirror columns on profiles. Nothing becomes
-- visible to any user in this phase — the upload UI, admin tab, toggle, and
-- public render are Phases 3–6.
--
-- ANNUAL LICENCE → expires_at exists in Phase 1, not retrofitted:
--   The GRA "Real Estate (House Agent) Licence" is issued under Tax Act
--   Ch. 80:01 s.29 (G$32,500) and MUST be renewed annually. Every approved
--   licence therefore carries an expiry date. `agent_documents.expires_at` is
--   only meaningful for document_type = 'license'; supporting docs don't expire.
--
-- COUNTRY_CODE IS STAMPED AT WRITE TIME, NEVER INHERITED:
--   Same rule as the money layer. A document's country_code is set by the
--   writer, not joined from anything. profiles.license_expires_at is likewise
--   COPIED from the approved licence at toggle time (Phase 5) so the public
--   listing render never has to join to agent_documents.
--
-- RLS IS ON FROM CREATION, not deferred to a later phase:
--   A table created via raw SQL does NOT get RLS automatically, and Supabase
--   exposes every public table through PostgREST. Without RLS the anon key
--   could read every agent's document metadata the moment this runs. RLS is
--   part of Phase 1. (Phase 2 is the storage BUCKET and its separate policies.)
--
-- Record-keeping: mirrors the SQL run manually in Supabase. CREATE TABLE /
-- CREATE POLICY / ADD CONSTRAINT are NOT idempotent (Postgres has no
-- ADD CONSTRAINT IF NOT EXISTS). Run once, then clear the editor. Indexes and
-- profiles ADD COLUMN use IF NOT EXISTS.

-- =====================================================================
-- 1. agent_documents table
--    ON DELETE choices, deliberate:
--      user_id     -> CASCADE : personal documents die with the account, and
--                               delete_user_completely (which only deletes from
--                               profiles) keeps working without knowing this
--                               table exists.
--      reviewed_by -> SET NULL: if an admin account is removed the document row
--                               survives — the audit trail outlives staff.
--      country_code-> RESTRICT (default): a territory with documents attached
--                               must not be deletable.
-- =====================================================================
CREATE TABLE agent_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  country_code  character varying NOT NULL REFERENCES territories(country_code),
  document_type text NOT NULL CHECK (document_type IN (
                  'license', 'gra', 'nis', 'id', 'business_registration', 'other')),
  storage_path  text NOT NULL,
  file_name     text,                                  -- original name, display only
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN (
                  'pending', 'approved', 'rejected')),
  reviewed_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  review_notes  text,
  expires_at    date                                   -- licence expiry; only meaningful for document_type='license'
);

-- =====================================================================
-- 2. Indexes
--      (country_code, status)             — admin "pending documents in my country"
--      (user_id)                          — an agent's own documents
--      (user_id, document_type, status)   — Phase 5 toggle: approved licence?
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_agent_documents_country_status
  ON agent_documents(country_code, status);
CREATE INDEX IF NOT EXISTS idx_agent_documents_user
  ON agent_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_documents_user_type_status
  ON agent_documents(user_id, document_type, status);

-- =====================================================================
-- 3. Row Level Security
--    Agents may read and create ONLY their own rows. No UPDATE or DELETE
--    policy exists — a document is immutable once uploaded (that is the point
--    of an audit trail; wrong file -> upload again). No anon policy: with RLS
--    on and no matching policy, anon gets nothing.
--
--    Admin access is NOT via RLS. It goes through the service-role client
--    behind requireAdmin, matching the codebase pattern; territory filtering
--    happens in the API route in Phase 4. These policies are auth.uid()-based,
--    NOT x-country-code-header-based — no header dependency.
-- =====================================================================
ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own documents"
  ON agent_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Agents can insert own documents"
  ON agent_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- 4. profiles — licence columns, mirroring the existing verified pattern
--    (is_verified_agent / verified_by / verified_at / verification_notes).
--    license_expires_at is COPIED here from the approved licence at toggle
--    time so the public render never joins to agent_documents.
-- =====================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_licensed_agent boolean NOT NULL DEFAULT false;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS licensed_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS licensed_at timestamptz;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS license_notes text;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS license_expires_at date;
