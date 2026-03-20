-- Enable Supabase Realtime on the profiles table
-- This allows the client to subscribe to credit updates in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
