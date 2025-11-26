-- ============================================================================
-- Migration: Fix Chat RPC Functions - Remove Obsolete Rank Column Reference
-- Description: Removes p.rank from get_messages() RPC functions.
--              The rank column was removed from profiles table in migration
--              20251126001945 when the rank system was refactored to use
--              user_statistics.user_rank instead.
--
--              This migration fixes the error:
--              "WITHIN GROUP is required for ordered-set aggregate rank"
-- ============================================================================

set check_function_bodies = off;

-- Update get_messages() function to remove rank field from profile object
CREATE OR REPLACE FUNCTION public.get_messages(
  p_group_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  result json;
begin
  -- Validate user is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Validate user is a member of the group
  if not exists(
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'You must be a member of the group to view messages';
  end if;

  -- Get messages with profile data joined
  select json_agg(
    json_build_object(
      'id', m.id,
      'group_id', m.group_id,
      'user_id', m.user_id,
      'content', m.content,
      'created_at', m.created_at,
      'updated_at', m.updated_at,
      'is_system_message', m.is_system_message,
      'emoji_type', m.emoji_type,
      'profile', json_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'created_at', p.created_at,
        'updated_at', p.updated_at
      )
    ) order by m.created_at asc
  ) into result
  from (
    select * from public.messages
    where group_id = p_group_id
    order by created_at desc
    limit p_limit
    offset p_offset
  ) m
  left join public.profiles p on p.id = m.user_id;

  -- Return empty array if no messages
  if result is null then
    result := '[]'::json;
  end if;

  return result;
end;
$function$;
