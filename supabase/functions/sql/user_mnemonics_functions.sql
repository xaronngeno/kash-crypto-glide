
-- Function to safely get a user's mnemonic
CREATE OR REPLACE FUNCTION get_user_mnemonic(user_id_param UUID)
RETURNS TABLE (main_mnemonic TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT um.main_mnemonic
  FROM public.user_mnemonics um
  WHERE um.user_id = user_id_param;
END;
$$;

-- Function to safely store a user's mnemonic
CREATE OR REPLACE FUNCTION store_user_mnemonic(
  user_id_param UUID,
  mnemonic_param TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_mnemonics (user_id, main_mnemonic)
  VALUES (user_id_param, mnemonic_param)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    main_mnemonic = mnemonic_param,
    updated_at = NOW();
END;
$$;
