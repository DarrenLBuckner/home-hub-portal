ALTER TABLE public.agent_documents
  ADD COLUMN IF NOT EXISTS name_on_document text,
  ADD COLUMN IF NOT EXISTS document_number  text,
  ADD COLUMN IF NOT EXISTS file_deleted_at  timestamptz;

COMMENT ON COLUMN public.agent_documents.name_on_document IS
  'Name exactly as printed on the document. Typed by the reviewer at review time. Survives file deletion (ephemeral storage) - this is the attestation of the name-match review standard. Nullable: not every document type carries a name worth recording.';

COMMENT ON COLUMN public.agent_documents.document_number IS
  'Document / licence number exactly as printed. Typed by the reviewer at review time. Enables duplicate detection after the file is deleted. Deliberately NOT unique - the GRA House Agent Licence is annual and a renewal may carry the same number, so a unique constraint would block the agents own renewal upload. Nullable.';

COMMENT ON COLUMN public.agent_documents.file_deleted_at IS
  'Timestamp the stored file was deleted from the agent-documents bucket. Stamped when the verification decision is submitted - approve OR reject, both are decisions. NULL means the file should still exist; NOT NULL means it is gone and this row is the only surviving record. Query for status != pending AND file_deleted_at IS NULL to find failed deletions. storage_path is deliberately retained after deletion as the forensic record of what was there.';
