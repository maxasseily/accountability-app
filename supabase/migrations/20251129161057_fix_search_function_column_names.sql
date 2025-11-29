-- Fix search_users_by_username function to use correct column names
-- goal_type was removed in favor of activity and sub_activity

DROP FUNCTION IF EXISTS public.search_users_by_username(text, int);

CREATE OR REPLACE FUNCTION public.search_users_by_username(search_query text, limit_count int DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  user_rank int,
  credibility numeric,
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
    ug.activity as goal_type,  -- Return activity as goal_type for backward compatibility
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

-- Re-grant execute permission
GRANT EXECUTE ON FUNCTION public.search_users_by_username(text, int) TO authenticated;
