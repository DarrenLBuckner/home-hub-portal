CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    INSERT INTO public.profiles (id, user_type)
    VALUES (new.id, 'user')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$function$;
