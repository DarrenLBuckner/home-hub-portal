-- Phase 2 - agent document verification.
-- Private bucket + territory-scoped RLS.
--
-- The storage policies and the public.agent_documents policies express the SAME rule.
-- The ONLY permitted difference: storage reads (storage.foldername(name))[1];
-- the table reads agent_documents.country_code. If these two ever diverge, it is a bug.
--
-- Path contract: {country_code}/{user_id}/{document_type}-{timestamp}.{ext}
--   (storage.foldername(name))[1] = country_code
--   (storage.foldername(name))[2] = user_id
--
-- admin_level 'super' ignores admin_country and both supers have admin_country NULL.
-- The super branch MUST be evaluated before any country comparison or Super Admins see nothing.

-- ---------------------------------------------------------------------------
-- 1. The bucket. Private. Constrained.
-- ---------------------------------------------------------------------------
-- property-images is public=true with 2,623 objects. This bucket holds licences and
-- national IDs. It must not resemble that one.
-- HEIC is deliberately excluded: iPhones shoot HEIC by default, browsers cannot render it,
-- and an accepted-but-unviewable document is worse than a rejected upload. The client
-- converts to JPEG before upload (Phase 3).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-documents',
  'agent-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Storage RLS
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Agents can upload own agent documents" ON storage.objects;
CREATE POLICY "Agents can upload own agent documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'agent-documents'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Agents can view own agent documents" ON storage.objects;
CREATE POLICY "Agents can view own agent documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'agent-documents'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Admins can view agent documents in their country" ON storage.objects;
CREATE POLICY "Admins can view agent documents in their country"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'agent-documents'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
      AND (
        (p.admin_level)::text = 'super'
        OR ((p.admin_level)::text IN ('owner', 'basic')
            AND (p.admin_country)::text = (storage.foldername(name))[1])
      )
  )
);

-- Delete-on-decision. Ephemeral storage depends on this policy existing.
DROP POLICY IF EXISTS "Admins can delete agent documents in their country" ON storage.objects;
CREATE POLICY "Admins can delete agent documents in their country"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'agent-documents'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
      AND (
        (p.admin_level)::text = 'super'
        OR ((p.admin_level)::text IN ('owner', 'basic')
            AND (p.admin_country)::text = (storage.foldername(name))[1])
      )
  )
);

-- ---------------------------------------------------------------------------
-- 3. Table RLS - the mirror
-- ---------------------------------------------------------------------------
-- Phase 1 shipped agent-scoped policies only (user_id = auth.uid()), so an admin
-- reading this table with their own JWT got zero rows. These two make the table
-- enforce the same boundary the bucket does, so Phase 4 never needs service-role.

DROP POLICY IF EXISTS "Admins can view agent documents in their country" ON public.agent_documents;
CREATE POLICY "Admins can view agent documents in their country"
ON public.agent_documents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
      AND (
        (p.admin_level)::text = 'super'
        OR ((p.admin_level)::text IN ('owner', 'basic')
            AND (p.admin_country)::text = (agent_documents.country_code)::text)
      )
  )
);

-- USING = which rows may be acted on. WITH CHECK = what the row may become.
-- Without WITH CHECK, a GY admin could set country_code='CO' and the row would
-- silently leave their territory with no error.
DROP POLICY IF EXISTS "Admins can review agent documents in their country" ON public.agent_documents;
CREATE POLICY "Admins can review agent documents in their country"
ON public.agent_documents FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
      AND (
        (p.admin_level)::text = 'super'
        OR ((p.admin_level)::text IN ('owner', 'basic')
            AND (p.admin_country)::text = (agent_documents.country_code)::text)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
      AND (
        (p.admin_level)::text = 'super'
        OR ((p.admin_level)::text IN ('owner', 'basic')
            AND (p.admin_country)::text = (agent_documents.country_code)::text)
      )
  )
);

-- No DELETE policy on public.agent_documents, deliberately.
-- "Rejected rows are never deleted. Status flips; the row stays." The audit trail is
-- enforced by the ABSENCE of a policy, not by good behaviour. Do not add one.
