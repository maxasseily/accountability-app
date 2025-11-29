-- Allow anyone to look up email by username for login purposes
-- This is needed because login happens before authentication
CREATE POLICY "Anyone can lookup email by username for login"
ON public.profiles
FOR SELECT
TO anon
USING (true);
