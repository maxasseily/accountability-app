-- Create post_reactions table
-- Allows users to react to daily photo posts with emojis
CREATE TABLE public.post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'bicep', 'brain', 'star_eyes', 'suspicious')),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Foreign keys
  CONSTRAINT post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.daily_photos(id) ON DELETE CASCADE,
  CONSTRAINT post_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Prevent duplicate reactions (same user, same post, same reaction type)
  CONSTRAINT post_reactions_unique_user_post_type UNIQUE (post_id, user_id, reaction_type)
);

-- Indexes for faster lookups
CREATE INDEX post_reactions_post_id_idx ON public.post_reactions (post_id);
CREATE INDEX post_reactions_user_id_idx ON public.post_reactions (user_id);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_reactions

-- Friends and group members can view reactions on posts they can see
CREATE POLICY "Friends and group members can view post reactions"
  ON public.post_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
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

-- Users can add reactions to posts they can see (but not their own)
CREATE POLICY "Users can add reactions to others' posts"
  ON public.post_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.daily_photos dp
      WHERE dp.id = post_reactions.post_id
      AND dp.user_id != auth.uid() -- Cannot react to own post
      AND (
        -- Group member's post
        EXISTS (
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

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON public.post_reactions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create post_comments table
-- Allows users to comment on daily photo posts
CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Foreign keys
  CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.daily_photos(id) ON DELETE CASCADE,
  CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ensure comment is not empty or too long
  CONSTRAINT post_comments_text_length CHECK (LENGTH(comment_text) > 0 AND LENGTH(comment_text) <= 1000)
);

-- Indexes for faster lookups
CREATE INDEX post_comments_post_id_idx ON public.post_comments (post_id);
CREATE INDEX post_comments_user_id_idx ON public.post_comments (user_id);
CREATE INDEX post_comments_created_at_idx ON public.post_comments (created_at DESC);

-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_comments

-- Friends and group members can view comments on posts they can see
CREATE POLICY "Friends and group members can view post comments"
  ON public.post_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
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

-- Users can add comments to posts they can see (but not their own)
CREATE POLICY "Users can add comments to others' posts"
  ON public.post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.daily_photos dp
      WHERE dp.id = post_comments.post_id
      AND dp.user_id != auth.uid() -- Cannot comment on own post
      AND (
        -- Group member's post
        EXISTS (
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

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.post_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.post_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Database Functions (RPC)

-- Function to toggle reaction on a post
-- If reaction exists, it removes it. If it doesn't exist, it adds it.
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

  -- Check if user is trying to react to their own post
  IF EXISTS (
    SELECT 1 FROM public.daily_photos
    WHERE id = p_post_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Cannot react to your own post';
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

-- Function to get reaction counts for a post
CREATE OR REPLACE FUNCTION public.get_post_reaction_counts(p_post_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_object_agg(reaction_type, count)
  INTO result
  FROM (
    SELECT reaction_type, COUNT(*)::int as count
    FROM public.post_reactions
    WHERE post_id = p_post_id
    GROUP BY reaction_type
  ) counts;

  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- Function to get user's reactions for a post
CREATE OR REPLACE FUNCTION public.get_user_reactions_for_post(p_post_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text[];
BEGIN
  SELECT array_agg(reaction_type)
  INTO result
  FROM public.post_reactions
  WHERE post_id = p_post_id AND user_id = auth.uid();

  RETURN COALESCE(result, ARRAY[]::text[]);
END;
$$;
