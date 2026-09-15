-- Keep legacy `other` profiles valid while allowing the roles exposed by the app.
ALTER TABLE public.user_profile
  DROP CONSTRAINT IF EXISTS user_profile_function_check;

ALTER TABLE public.user_profile
  ADD CONSTRAINT user_profile_function_check
  CHECK (function IN ('admin', 'superviseur', 'caissiere', 'collector', 'other'));
