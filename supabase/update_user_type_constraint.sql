-- Update users_user_type_check constraint to allow 'owner' as a user_type
ALTER TABLE users
  DROP CONSTRAINT users_user_type_check,
  ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('landlord', 'agent', 'admin', 'tenant', 'owner'));
