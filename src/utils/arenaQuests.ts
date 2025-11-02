import { supabase } from '../lib/supabase';
import type { ArenaQuest, ArenaQuestWithProfiles, QuestType } from '../types/arena';

/**
 * Send an arena quest request to another user
 */
export async function sendArenaQuestRequest(
  groupId: string,
  receiverId: string,
  questType: QuestType
): Promise<string> {
  const { data, error } = await supabase.rpc('send_arena_quest_request', {
    p_group_id: groupId,
    p_receiver_id: receiverId,
    p_quest_type: questType,
  });

  if (error) {
    console.error('Error sending arena quest request:', error);
    throw error;
  }

  return data as string;
}

/**
 * Respond to an arena quest request (accept or reject)
 */
export async function respondToArenaQuest(
  questId: string,
  accept: boolean
): Promise<boolean> {
  const { data, error } = await supabase.rpc('respond_to_arena_quest', {
    p_quest_id: questId,
    p_accept: accept,
  });

  if (error) {
    console.error('Error responding to arena quest:', error);
    throw error;
  }

  return data as boolean;
}

/**
 * Get all accepted quests for a group
 */
export async function getAcceptedQuestsForGroup(
  groupId: string
): Promise<ArenaQuestWithProfiles[]> {
  // First, get the quests
  const { data: quests, error: questsError } = await supabase
    .from('arena_quests')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });

  if (questsError) {
    console.error('Error fetching accepted quests:', questsError);
    throw questsError;
  }

  if (!quests || quests.length === 0) {
    return [];
  }

  // Get unique user IDs
  const userIds = [...new Set([...quests.map(q => q.sender_id), ...quests.map(q => q.receiver_id)])];

  // Fetch profiles for all users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }

  // Create a map of user ID to profile
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Combine quests with profiles
  return quests.map(quest => ({
    ...quest,
    sender_profile: profileMap.get(quest.sender_id) || { full_name: null, email: 'Unknown' },
    receiver_profile: profileMap.get(quest.receiver_id) || { full_name: null, email: 'Unknown' },
  })) as ArenaQuestWithProfiles[];
}

/**
 * Get all pending quest requests for the current user (both sent and received)
 */
export async function getPendingQuestsForUser(
  userId: string
): Promise<ArenaQuestWithProfiles[]> {
  // Get quests where user is either sender or receiver
  const { data: quests, error: questsError } = await supabase
    .from('arena_quests')
    .select('*')
    .eq('status', 'pending')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (questsError) {
    console.error('Error fetching pending quests:', questsError);
    throw questsError;
  }

  if (!quests || quests.length === 0) {
    return [];
  }

  // Get unique user IDs
  const userIds = [...new Set([...quests.map(q => q.sender_id), ...quests.map(q => q.receiver_id)])];

  // Fetch profiles for all users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }

  // Create a map of user ID to profile
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Combine quests with profiles
  return quests.map(quest => ({
    ...quest,
    sender_profile: profileMap.get(quest.sender_id) || { full_name: null, email: 'Unknown' },
    receiver_profile: profileMap.get(quest.receiver_id) || { full_name: null, email: 'Unknown' },
  })) as ArenaQuestWithProfiles[];
}

/**
 * Format a quest for display
 */
export function formatQuestDisplay(quest: ArenaQuestWithProfiles): string {
  const senderName =
    quest.sender_profile.full_name || quest.sender_profile.email.split('@')[0];
  const receiverName =
    quest.receiver_profile.full_name || quest.receiver_profile.email.split('@')[0];

  switch (quest.quest_type) {
    case 'alliance':
      return `${senderName} is in an alliance with ${receiverName} 🤝`;
    case 'battle':
      return `${senderName} and ${receiverName} are battling it out ⚔️`;
    case 'prophecy':
      return `${senderName} is prophesying about ${receiverName} 🔮`;
    case 'curse':
      return `${senderName} has put a curse on ${receiverName} 💀`;
    default:
      return `${senderName} and ${receiverName} are on a quest`;
  }
}
