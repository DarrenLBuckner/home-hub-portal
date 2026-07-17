-- Blank strings are not values.
--
-- Found live on 2026-07-15/16: agent_vetting.license_number is '' (empty string, not NULL)
-- for 53 of 61 approved agents. count(license_number) counts empty strings, so the column
-- reported 60 agents holding a licence when the real figure was 5. A fake metric with no
-- author - nobody lied, the count was simply false.
--
-- name_on_document and document_number are transcribed by a reviewer off a physical
-- document AFTER the file has been deleted (ephemeral storage). They are the attestation.
-- An attestation that says '' is worse than one that says nothing, because '' counts.
--
-- NULL means not provided. Blank means nothing and may not pretend otherwise.

ALTER TABLE public.agent_documents
  ADD CONSTRAINT agent_documents_name_on_document_not_blank
    CHECK (name_on_document IS NULL OR length(trim(name_on_document)) > 0),
  ADD CONSTRAINT agent_documents_document_number_not_blank
    CHECK (document_number IS NULL OR length(trim(document_number)) > 0);
