-- ============================================================================
-- Migration: Add Chat RPC Functions
-- Description: Creates server-side RPC functions for chat operations:
--              - send_message: Send a new message to a group (with validation)
--              - get_messages: Retrieve messages with profile data joined
--              These functions use SECURITY DEFINER to properly access auth.uid()
--              and enforce group membership validation.
-- ============================================================================

set check_function_bodies = off;

-- Create function to send a message to a group

CREATE OR REPLACE FUNCTION public.send_message(
  p_group_id uuid,
  p_content text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  new_message_id uuid;
  result json;
begin
  -- Validate user is authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Validate content
  if p_content is null or trim(p_content) = '' then
    raise exception 'Message content cannot be empty';
  end if;

  if char_length(p_content) > 5000 then
    raise exception 'Message content exceeds maximum length of 5000 characters';
  end if;

  -- Validate user is a member of the group
  if not exists(
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'You must be a member of the group to send messages';
  end if;

  -- Insert the message
  insert into public.messages (group_id, user_id, content)
  values (p_group_id, auth.uid(), trim(p_content))
  returning id into new_message_id;

  -- Return the created message
  select json_build_object(
    'id', m.id,
    'group_id', m.group_id,
    'user_id', m.user_id,
    'content', m.content,
    'created_at', m.created_at,
    'updated_at', m.updated_at
  ) into result
  from public.messages m
  where m.id = new_message_id;

  return result;
end;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text) TO authenticated;

-- Create function to get messages for a group with profile data
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
      'profile', json_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'rank', p.rank
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_messages(uuid, integer, integer) TO authenticated;
