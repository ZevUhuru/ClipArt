-- Prevent created_at from being changed after initial insert
CREATE OR REPLACE FUNCTION public.protect_created_at()
RETURNS trigger AS $$
BEGIN
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_profiles_created_at ON public.profiles;
CREATE TRIGGER protect_profiles_created_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_created_at();
