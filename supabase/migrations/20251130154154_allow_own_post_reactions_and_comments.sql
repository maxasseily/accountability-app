-- Allow users to react to and comment on their own posts
-- This migration removes the "cannot react/comment to own post" restrictions

-- Drop the old reaction insert policy
DROP POLICY IF EXISTS "Users can add reactions to others' posts" ON public.post_reactions;

-- Create new policy that allows reacting to own posts
CREATE POLICY "Users can add reactions to posts they can see"
  ON public.post_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.daily_photos dp
      WHERE dp.id = post_reactions.post_id
      AND (
        -- Own post
        dp.user_id = auth.uid()
        -- Group member's post
        OR EXISTS (
          SELECT 1 FROM public.group_members gm1
          JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
          WHERE gm1.user_id = auth.uid() AND gm2.user_id = dp.user_id
        )
        -- Friend's post
        OR EXISTS (
          SELECT 1 FROM public.friendships f
          WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = dp.user_id) OR
                 (f.user_id_2 = auth.uid() AND f.user_id_1 = dp.user_id))
          AND f.status = 'accepted'
        )
      )
    )
  );

-- Drop the old comment insert policy
DROP POLICY IF EXISTS "Users can add comments to others' posts" ON public.post_comments;

-- Create new policy that allows commenting on own posts
CREATE POLICY "Users can add comments to posts they can see"
  ON public.post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.daily_photos dp
      WHERE dp.id = post_comments.post_id
      AND (
        -- Own post
        dp.user_id = auth.uid()
        -- Group member's post
        OR EXISTS (
          SELECT 1 FROM public.group_members gm1
          JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
          WHERE gm1.user_id = auth.uid() AND gm2.user_id = dp.user_id
        )
        -- Friend's post
        OR EXISTS (
          SELECT 1 FROM public.friendships f
          WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = dp.user_id) OR
                 (f.user_id_2 = auth.uid() AND f.user_id_1 = dp.user_id))
          AND f.status = 'accepted'
        )
      )
    )
  );

-- Update the toggle_post_reaction function to remove the own-post check
CREATE OR REPLACE FUNCTION public.toggle_post_reaction(
  p_post_id uuid,
  p_reaction_type text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_reaction uuid;
  result json;
BEGIN
  -- Validate reaction type
  IF p_reaction_type NOT IN ('heart', 'bicep', 'brain', 'star_eyes', 'suspicious') THEN
    RAISE EXCEPTION 'Invalid reaction type';
  END IF;

  -- Check if reaction already exists
  SELECT id INTO existing_reaction
  FROM public.post_reactions
  WHERE post_id = p_post_id
    AND user_id = auth.uid()
    AND reaction_type = p_reaction_type;

  IF existing_reaction IS NOT NULL THEN
    -- Remove reaction
    DELETE FROM public.post_reactions WHERE id = existing_reaction;
    result := json_build_object('action', 'removed', 'reaction_type', p_reaction_type);
  ELSE
    -- Add reaction
    INSERT INTO public.post_reactions (post_id, user_id, reaction_type)
    VALUES (p_post_id, auth.uid(), p_reaction_type)
    RETURNING json_build_object(
      'action', 'added',
      'reaction_type', reaction_type,
      'id', id,
      'created_at', created_at
    ) INTO result;
  END IF;

  RETURN result;
END;
$$;
