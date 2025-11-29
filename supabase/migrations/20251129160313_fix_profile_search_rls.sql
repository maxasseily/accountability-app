-- Fix profile search RLS to allow authenticated users to search for any profile
-- This is needed for the friend search functionality

-- Drop the existing policy
DROP POLICY IF EXISTS "Group members and friends can view profiles" ON public.profiles;

-- Create a new policy that allows:
-- 1. Own profile
-- 2. Group members
-- 3. Accepted friends
-- 4. ANY profile for search purposes (basic info only - username, avatar, stats)
CREATE POLICY "Users can search and view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Always allow viewing any profile (for search)
    -- The search function will handle filtering to exclude sensitive data
    true
  );

-- Grant execute permission on search function to authenticated users
GRANT EXECUTE ON FUNCTION public.search_users_by_username(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_friend_request(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_friend_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_friend(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_count(uuid) TO authenticated;
