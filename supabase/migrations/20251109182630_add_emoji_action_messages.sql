-- ============================================================================
-- Migration: Add Emoji Action Messages
-- Description: Adds support for emoji action messages in group chat.
--              Adds is_system_message and emoji_type fields to messages table,
--              and creates send_emoji_action RPC function for sending these
--              special motivational messages (lock in, mayday, rally).
-- ============================================================================

-- Add new columns to messages table for emoji actions
ALTER TABLE public.messages
  ADD COLUMN is_system_message BOOLEAN DEFAULT FALSE,
  ADD COLUMN emoji_type TEXT CHECK (emoji_type IN ('lock', 'mayday', 'rally'));

-- Create index for filtering system messages
CREATE INDEX messages_is_system_message_idx ON public.messages(is_system_message);

-- Update get_messages function to include new fields
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

-- Create function to send an emoji action message
CREATE OR REPLACE FUNCTION public.send_emoji_action(
  p_group_id uuid,
  p_content text,
  p_emoji_type text
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

  -- Validate emoji_type
  if p_emoji_type not in ('lock', 'mayday', 'rally') then
    raise exception 'Invalid emoji type';
  end if;

  -- Validate user is a member of the group
  if not exists(
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'You must be a member of the group to send messages';
  end if;

  -- Insert the emoji action message
  insert into public.messages (group_id, user_id, content, is_system_message, emoji_type)
  values (p_group_id, auth.uid(), trim(p_content), true, p_emoji_type)
  returning id into new_message_id;

  -- Return the created message
  select json_build_object(
    'id', m.id,
    'group_id', m.group_id,
    'user_id', m.user_id,
    'content', m.content,
    'created_at', m.created_at,
    'updated_at', m.updated_at,
    'is_system_message', m.is_system_message,
    'emoji_type', m.emoji_type
  ) into result
  from public.messages m
  where m.id = new_message_id;

  return result;
end;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_emoji_action(uuid, text, text) TO authenticated;
