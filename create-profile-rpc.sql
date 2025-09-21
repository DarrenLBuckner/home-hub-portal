-- Create a function to directly retrieve profiles
CREATE OR REPLACE FUNCTION public.get_profile_by_id(user_id UUID)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.profiles
  WHERE id = user_id;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_profile_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_by_id(UUID) TO anon;