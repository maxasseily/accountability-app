-- Create friendships table (bidirectional relationship)
CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 uuid NOT NULL,
  user_id_2 uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  requester_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Foreign keys
  CONSTRAINT friendships_user_id_1_fkey FOREIGN KEY (user_id_1) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT friendships_user_id_2_fkey FOREIGN KEY (user_id_2) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT friendships_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ensure user_id_1 is always less than user_id_2 (normalized bidirectional)
  CONSTRAINT friendships_ordered_users CHECK (user_id_1 < user_id_2),

  -- Prevent duplicate friendships
  CONSTRAINT friendships_unique_pair UNIQUE (user_id_1, user_id_2)
);

-- Indexes for faster lookups
CREATE INDEX friendships_user_id_1_idx ON public.friendships (user_id_1);
CREATE INDEX friendships_user_id_2_idx ON public.friendships (user_id_2);
CREATE INDEX friendships_status_idx ON public.friendships (status);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view friendships they're part of
CREATE POLICY "Users can view their friendships"
  ON public.friendships
  FOR SELECT
  TO authenticated
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- Users can create friend requests
CREATE POLICY "Users can create friend requests"
  ON public.friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid() AND
    (user_id_1 = auth.uid() OR user_id_2 = auth.uid()) AND
    status = 'pending'
  );

-- Users can update friendships they're part of (accept/block)
CREATE POLICY "Users can update their friendships"
  ON public.friendships
  FOR UPDATE
  TO authenticated
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- Users can delete their friendships
CREATE POLICY "Users can delete their friendships"
  ON public.friendships
  FOR DELETE
  TO authenticated
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- Database Functions (RPC)

-- Function to send friend request (handles user ordering)
CREATE OR REPLACE FUNCTION public.send_friend_request(target_username text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  user1 uuid;
  user2 uuid;
  result json;
BEGIN
  -- Find target user by username (case-insensitive)
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE LOWER(username) = LOWER(target_username);

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot send friend request to yourself';
  END IF;

  -- Order user IDs using LEAST/GREATEST
  user1 := LEAST(auth.uid(), target_user_id);
  user2 := GREATEST(auth.uid(), target_user_id);

  -- Check if friendship already exists
  IF EXISTS (
    SELECT 1 FROM public.friendships
    WHERE user_id_1 = user1 AND user_id_2 = user2
  ) THEN
    RAISE EXCEPTION 'Friend request already exists';
  END IF;

  -- Insert friendship
  INSERT INTO public.friendships (user_id_1, user_id_2, requester_id, status)
  VALUES (user1, user2, auth.uid(), 'pending')
  RETURNING json_build_object(
    'id', id,
    'user_id_1', user_id_1,
    'user_id_2', user_id_2,
    'status', status,
    'created_at', created_at
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to accept friend request
CREATE OR REPLACE FUNCTION public.accept_friend_request(friendship_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.friendships
  SET status = 'accepted', updated_at = now()
  WHERE id = friendship_id
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
    AND requester_id != auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friend request not found or cannot be accepted';
  END IF;
END;
$$;

-- Function to remove friend (bidirectional deletion)
CREATE OR REPLACE FUNCTION public.remove_friend(friendship_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.friendships
  WHERE id = friendship_id
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Friendship not found';
  END IF;
END;
$$;

-- Function to search users by username
CREATE OR REPLACE FUNCTION public.search_users_by_username(search_query text, limit_count int DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  user_rank int,
  credibility int,
  mojo numeric,
  goal_type text,
  sub_activity text,
  displayed_badge_icon text,
  displayed_badge_name text,
  friendship_status text,
  friendship_id uuid,
  requester_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.username,
    p.avatar_url,
    COALESCE(us.user_rank, 1) as user_rank,
    COALESCE(us.credibility, 50) as credibility,
    COALESCE(us.mojo, 0) as mojo,
    ug.goal_type,
    ug.sub_activity,
    b.icon as displayed_badge_icon,
    b.name as displayed_badge_name,
    f.status as friendship_status,
    f.id as friendship_id,
    f.requester_id
  FROM public.profiles p
  LEFT JOIN public.user_statistics us ON p.id = us.user_id
  LEFT JOIN public.user_goals ug ON p.id = ug.user_id
  LEFT JOIN public.badges b ON p.displayed_badge_id = b.id
  LEFT JOIN public.friendships f ON (
    (f.user_id_1 = LEAST(auth.uid(), p.id) AND f.user_id_2 = GREATEST(auth.uid(), p.id))
  )
  WHERE LOWER(p.username) LIKE LOWER(search_query || '%')
    AND p.id != auth.uid()
  ORDER BY p.username
  LIMIT limit_count;
END;
$$;

-- Function to get friend count
CREATE OR REPLACE FUNCTION public.get_friend_count(target_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_result int;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM public.friendships
  WHERE (user_id_1 = target_user_id OR user_id_2 = target_user_id)
    AND status = 'accepted';

  RETURN count_result;
END;
$$;

-- Update RLS policies to allow friends to view each other's data

-- Drop existing profiles select policy (will be recreated with friend access)
DROP POLICY IF EXISTS "Group members can view each other's profiles" ON public.profiles;

-- Allow friends to view each other's profiles
CREATE POLICY "Group members and friends can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = profiles.id
    )
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = profiles.id) OR
             (f.user_id_2 = auth.uid() AND f.user_id_1 = profiles.id))
      AND f.status = 'accepted'
    )
  );

-- Allow friends to view each other's statistics
CREATE POLICY "Friends can view each other's statistics"
  ON public.user_statistics
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = user_statistics.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = user_statistics.user_id) OR
             (f.user_id_2 = auth.uid() AND f.user_id_1 = user_statistics.user_id))
      AND f.status = 'accepted'
    )
  );

-- Allow friends to view each other's photos
CREATE POLICY "Friends can view each other's daily photos"
  ON public.daily_photos
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() AND gm2.user_id = daily_photos.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE ((f.user_id_1 = auth.uid() AND f.user_id_2 = daily_photos.user_id) OR
             (f.user_id_2 = auth.uid() AND f.user_id_1 = daily_photos.user_id))
      AND f.status = 'accepted'
    )
  );
