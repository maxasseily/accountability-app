-- Fix RLS policy that was blocking goal creation for users not in groups
-- The "Group members can view each other's goals" policy was trying to access group_members
-- table during INSERT operations, causing permission denied errors

-- Drop the problematic policy
DROP POLICY IF EXISTS "Group members can view each other's goals" ON public.user_goals;

-- Recreate it with proper table grants to avoid permission issues
-- This policy allows group members to view each other's goals
-- It will only match when both users are in the same group
CREATE POLICY "Group members can view each other's goals"
ON public.user_goals
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Allow if the requesting user and the goal owner are in the same group
  EXISTS (
    SELECT 1
    FROM public.group_members gm1
    INNER JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = user_goals.user_id
  )
);

-- Ensure group_members table has the necessary SELECT grant for authenticated users
-- This allows the policy above to actually query the table
GRANT SELECT ON public.group_members TO authenticated;
