import { supabase } from '../lib/supabase';
import type { ArenaQuest, ArenaQuestWithProfiles, QuestType } from '../types/arena';

/**
 * Send an arena quest request to another user
 */
export async function sendArenaQuestRequest(
  groupId: string,
  receiverId: string,
  questType: QuestType,
  mojoStake?: number
): Promise<string> {
  const { data, error } = await supabase.rpc('send_arena_quest_request', {
    p_group_id: groupId,
    p_receiver_id: receiverId,
    p_quest_type: questType,
    p_mojo_stake: mojoStake || 0,
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

/**
 * Calculate odds for a prophecy or curse based on receiver's credibility
 */
export function calculateOdds(questType: QuestType, receiverCredibility: number): number {
  if (questType === 'prophecy') {
    // Prophecy: betting receiver will succeed (higher credibility = lower odds)
    if (receiverCredibility <= 0) return 100;
    if (receiverCredibility >= 100) return 1;
    return 100 / receiverCredibility;
  } else if (questType === 'curse') {
    // Curse: betting receiver will fail (higher credibility = higher odds needed)
    if (receiverCredibility >= 100) return 100;
    if (receiverCredibility <= 0) return 1;
    return 100 / (100 - receiverCredibility);
  }
  return 0;
}

/**
 * Calculate potential payout for a bet
 * Returns total payout including stake return: stake * (1 + odds)
 * So 1:1 odds with 10 mojo stake = 20 mojo total (10 stake + 10 winnings)
 */
export function calculatePotentialPayout(mojoStake: number, odds: number): number {
  return mojoStake * (1 + odds);
}

/**
 * Check if an identical quest already exists between two users
 * Returns the existing quest if found, null otherwise
 */
export async function checkExistingQuest(
  groupId: string,
  senderId: string,
  receiverId: string,
  questType: QuestType
): Promise<ArenaQuest | null> {
  const { data, error } = await supabase
    .from('arena_quests')
    .select('*')
    .eq('group_id', groupId)
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .eq('quest_type', questType)
    .in('status', ['pending', 'accepted'])
    .maybeSingle();

  if (error) {
    console.error('Error checking existing quest:', error);
    return null;
  }

  return data as ArenaQuest | null;
}

/**
 * Get total mojo staked in pending prophecy/curse quests for a user
 * This is mojo that's been requested but not yet accepted/rejected
 */
export async function getPendingMojoStakes(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('arena_quests')
    .select('mojo_stake')
    .eq('sender_id', userId)
    .eq('status', 'pending')
    .in('quest_type', ['prophecy', 'curse']);

  if (error) {
    console.error('Error fetching pending mojo stakes:', error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  // Sum up all pending stakes
  return data.reduce((total, quest) => total + (quest.mojo_stake || 0), 0);
}
