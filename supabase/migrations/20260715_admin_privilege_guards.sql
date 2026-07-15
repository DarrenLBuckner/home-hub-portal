-- Admin privilege guards: close the fall-through escalation paths.
--
-- PERMANENT RULE — DEFAULT DENY:
--   Authorization branches must be an explicit ALLOW-LIST terminating in a
--   catch-all RAISE. Restricting only known-bad cases means every unforeseen
--   case (a new admin_level, a typo, a NULL) silently succeeds. Both functions
--   below previously restricted 'owner' and let 'basic' fall through to the
--   UPDATE unguarded.
--
-- PERMANENT RULE — NULL-SAFE COMPARISON:
--   Use IS DISTINCT FROM, never != / <>, in an authorization check. `NULL != 'GY'`
--   evaluates to NULL, not TRUE, so the IF never fires and the check is skipped
--   entirely. A NULL argument must fail closed, not pass through.
--
-- admin_level taxonomy: 'super' | 'owner' | 'basic'.
--   super  -> Darren, Selena. Full control.
--   owner  -> territory operator (Qumar/GY, Selena/CO). May create basic admins
--             in their OWN country only. May not create or remove owner/super.
--   basic  -> operational admin (Alphius). May NOT promote or demote anyone.
--
-- CREATE OR REPLACE is idempotent — safe to re-run. Signatures match the live DB
-- exactly, so these REPLACE the existing functions rather than creating overloads.

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(
    target_user_id uuid,
    new_admin_level text,
    assigned_country_id text DEFAULT NULL::text,
    admin_display_name text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_admin_level TEXT;
    current_admin_country TEXT;
BEGIN
    SELECT admin_level, country_id
      INTO current_admin_level, current_admin_country
    FROM profiles
    WHERE id = auth.uid() AND user_type = 'admin';

    IF current_admin_level IS NULL THEN
        RAISE EXCEPTION 'Only admins can promote users';
    END IF;

    -- Validate the requested level against the taxonomy (no CHECK constraint exists)
    IF new_admin_level IS NULL OR new_admin_level NOT IN ('super', 'owner', 'basic') THEN
        RAISE EXCEPTION 'Invalid admin level: %', COALESCE(new_admin_level, 'NULL');
    END IF;

    -- ALLOW-LIST. Anything not matched below is denied by the ELSE.
    IF current_admin_level = 'super' THEN
        NULL;  -- super may create any level in any territory

    ELSIF current_admin_level = 'owner' THEN
        IF new_admin_level <> 'basic' THEN
            RAISE EXCEPTION 'Owner admins can only create basic admins';
        END IF;
        -- IS DISTINCT FROM: a NULL country must fail, not slip through
        IF assigned_country_id IS DISTINCT FROM current_admin_country THEN
            RAISE EXCEPTION 'Owner admins can only create admins in their assigned country';
        END IF;

    ELSE
        RAISE EXCEPTION 'Insufficient privileges to promote users';
    END IF;

    UPDATE profiles
    SET user_type        = 'admin',
        admin_level      = new_admin_level,
        country_id       = assigned_country_id,
        display_name     = admin_display_name,
        created_by_admin = auth.uid(),
        admin_created_at = NOW()
    WHERE id = target_user_id;

    INSERT INTO admin_activity_log (admin_id, action_type, target_user_id, performed_by, details)
    VALUES (target_user_id, 'user_promoted', target_user_id, auth.uid(),
            jsonb_build_object('new_level', new_admin_level, 'country_id', assigned_country_id));

    RETURN TRUE;
END;
$function$;


CREATE OR REPLACE FUNCTION public.remove_admin_privileges(
    target_user_id uuid,
    new_user_type text DEFAULT 'fsbo'::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_admin_level TEXT;
    current_admin_country TEXT;
    target_admin_level TEXT;
    target_admin_country TEXT;
BEGIN
    SELECT admin_level, country_id
      INTO current_admin_level, current_admin_country
    FROM profiles
    WHERE id = auth.uid() AND user_type = 'admin';

    IF current_admin_level IS NULL THEN
        RAISE EXCEPTION 'Only admins can remove admin privileges';
    END IF;

    SELECT admin_level, country_id
      INTO target_admin_level, target_admin_country
    FROM profiles
    WHERE id = target_user_id AND user_type = 'admin';

    -- Target must actually BE an admin. Previously NULL here fell through,
    -- letting an admin flip any agent's user_type to 'fsbo'.
    IF target_admin_level IS NULL THEN
        RAISE EXCEPTION 'Target user is not an admin';
    END IF;

    -- ALLOW-LIST. Anything not matched below is denied by the ELSE.
    IF current_admin_level = 'super' THEN
        NULL;  -- super may remove any admin

    ELSIF current_admin_level = 'owner' THEN
        IF target_admin_level <> 'basic' THEN
            RAISE EXCEPTION 'Owner admins can only remove basic admins';
        END IF;
        IF target_admin_country IS DISTINCT FROM current_admin_country THEN
            RAISE EXCEPTION 'Owner admins can only remove admins from their country';
        END IF;

    ELSE
        RAISE EXCEPTION 'Insufficient privileges to remove admin privileges';
    END IF;

    UPDATE profiles
    SET user_type        = new_user_type,
        admin_level      = NULL,
        created_by_admin = NULL,
        admin_created_at = NULL
    WHERE id = target_user_id;

    DELETE FROM admin_permissions WHERE admin_id = target_user_id;

    INSERT INTO admin_activity_log (admin_id, action_type, target_user_id, performed_by, details)
    VALUES (auth.uid(), 'admin_removed', target_user_id, auth.uid(),
            jsonb_build_object('previous_level', target_admin_level, 'new_user_type', new_user_type));

    RETURN TRUE;
END;
$function$;
