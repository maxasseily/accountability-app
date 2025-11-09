-- Allow users to view statistics of members in their groups
-- This is needed for prophecy/curse betting to show credibility scores

CREATE POLICY "Users can view statistics of group members"
ON "public"."user_statistics"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- User can view their own statistics
  auth.uid() = user_id
  OR
  -- User can view statistics of users in the same group
  EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = user_statistics.user_id
  )
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own statistics" ON "public"."user_statistics";
