import { supabase } from '../lib/supabase';
import type { ArenaQuest, ArenaQuestWithProfiles, QuestType } from '../types/arena';

/**
 * Send an arena quest request to another user
 * For prophecy/curse: Creates instantly without requiring acceptance
 * For alliance/battle: Creates pending request that requires acceptance
 */
export async function sendArenaQuestRequest(
  groupId: string,
  receiverId: string,
  questType: QuestType,
  mojoStake?: number
): Promise<string> {
  // For prophecy/curse, use instant creation function
  if (questType === 'prophecy' || questType === 'curse') {
    const { data, error } = await supabase.rpc('create_instant_prophecy_curse', {
      p_group_id: groupId,
      p_receiver_id: receiverId,
      p_quest_type: questType,
      p_mojo_stake: mojoStake || 0,
    });

    if (error) {
      console.error('Error creating instant prophecy/curse:', error);
      throw error;
    }

    return data as string;
  }

  // For alliance/battle, use traditional request flow
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
  // Exclude speculation quests as they are fetched separately via getPendingSpeculationsForGroup
  const { data: quests, error: questsError } = await supabase
    .from('arena_quests')
    .select('*')
    .eq('status', 'pending')
    .neq('quest_type', 'speculation')
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
    case 'speculation': {
      const creatorSide = quest.speculation_creator_side ? 'FOR' : 'AGAINST';
      const accepterName = quest.speculation_accepter_id ? receiverName : 'Pending';
      const accepterSide = quest.speculation_creator_side ? 'AGAINST' : 'FOR';

      if (quest.status === 'resolved') {
        const result = quest.speculation_result ? 'YES' : 'NO';
        return `🌀 "${quest.speculation_description}" - Result: ${result}`;
      } else if (quest.status === 'accepted') {
        return `🌀 ${senderName} (${creatorSide}) vs ${accepterName} (${accepterSide}): "${quest.speculation_description}"`;
      } else {
        return `🌀 ${senderName} (${creatorSide}): "${quest.speculation_description}"`;
      }
    }
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
 * So 1:1 odds with 10 mojo stake = 20 mojo total (10 stake back + 10 profit)
 * NOTE: This is used by the database. Frontend should display only profit (stake * odds)
 */
export function calculatePotentialPayout(mojoStake: number, odds: number): number {
  return mojoStake * (1 + odds);
}

/**
 * Check if an identical quest already exists between two users
 * For two-way quests (alliance/battle), checks both directions
 * Returns the existing quest if found, null otherwise
 */
export async function checkExistingQuest(
  groupId: string,
  senderId: string,
  receiverId: string,
  questType: QuestType
): Promise<ArenaQuest | null> {
  // For two-way quests (alliance/battle), check both directions
  if (questType === 'alliance' || questType === 'battle') {
    const { data, error } = await supabase
      .from('arena_quests')
      .select('*')
      .eq('group_id', groupId)
      .eq('quest_type', questType)
      .in('status', ['pending', 'accepted'])
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`);

    if (error) {
      console.error('Error checking existing quest:', error);
      return null;
    }

    return data && data.length > 0 ? (data[0] as ArenaQuest) : null;
  }

  // For one-way quests (prophecy/curse), check only sender -> receiver
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

/**
 * Get day of week (0 = Monday, 6 = Sunday)
 */
function getDayOfWeek(): number {
  const now = new Date();
  const day = now.getDay();
  // Convert Sunday (0) to 6, and shift others down by 1 (Monday = 0)
  return day === 0 ? 6 : day - 1;
}

/**
 * Check if it's too late in the week for a curse to be valid
 * A curse can only be placed if there's still enough time for the receiver to complete their goal
 * For example, if the goal is 3/week and it's Saturday (day 5) and they have 0 progress,
 * they can't complete 3 in 1 day
 */
export function isTooLateForCurse(currentProgress: number, frequency: number): boolean {
  const dayOfWeek = getDayOfWeek(); // 0 = Monday, 6 = Sunday
  const daysRemaining = 7 - dayOfWeek; // Including today
  const progressNeeded = frequency - currentProgress;

  // If they need more progress than days remaining (including today), it's impossible
  return progressNeeded > daysRemaining;
}

/**
 * Check if receiver has already completed their weekly goal (prophecy would be pointless)
 */
export function hasAlreadyCompletedGoal(currentProgress: number, frequency: number): boolean {
  return currentProgress >= frequency;
}

/**
 * Create a speculation quest
 */
export async function createSpeculationQuest(
  groupId: string,
  description: string,
  creatorSide: boolean,
  odds: number,
  mojoStake: number
): Promise<string> {
  const { data, error } = await supabase.rpc('create_speculation_quest', {
    p_group_id: groupId,
    p_description: description,
    p_creator_side: creatorSide,
    p_odds: odds,
    p_mojo_stake: mojoStake,
  });

  if (error) {
    console.error('Error creating speculation quest:', error);
    throw error;
  }

  return data as string;
}

/**
 * Accept a speculation quest
 */
export async function acceptSpeculationQuest(questId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('accept_speculation_quest', {
    p_quest_id: questId,
  });

  if (error) {
    console.error('Error accepting speculation quest:', error);
    throw error;
  }

  return data as boolean;
}

/**
 * Resolve a speculation quest (by a third party)
 */
export async function resolveSpeculationQuest(
  questId: string,
  result: boolean
): Promise<boolean> {
  const { data, error } = await supabase.rpc('resolve_speculation_quest', {
    p_quest_id: questId,
    p_result: result,
  });

  if (error) {
    console.error('Error resolving speculation quest:', error);
    throw error;
  }

  return data as boolean;
}

/**
 * Get pending speculation offers for a group
 */
export async function getPendingSpeculationsForGroup(
  groupId: string
): Promise<ArenaQuestWithProfiles[]> {
  // Get speculation quests that are pending acceptance
  const { data: quests, error: questsError } = await supabase
    .from('arena_quests')
    .select('*')
    .eq('group_id', groupId)
    .eq('quest_type', 'speculation')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (questsError) {
    console.error('Error fetching pending speculations:', questsError);
    throw questsError;
  }

  if (!quests || quests.length === 0) {
    return [];
  }

  // Get unique user IDs
  const userIds = [...new Set(quests.map(q => q.sender_id))];

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
    receiver_profile: { full_name: null, email: 'Pending' }, // No receiver yet
  })) as ArenaQuestWithProfiles[];
}

/**
 * Get accepted (ongoing) speculation quests for a group
 */
export async function getAcceptedSpeculationsForGroup(
  groupId: string
): Promise<ArenaQuestWithProfiles[]> {
  // Get speculation quests that are accepted but not resolved
  const { data: quests, error: questsError } = await supabase
    .from('arena_quests')
    .select('*')
    .eq('group_id', groupId)
    .eq('quest_type', 'speculation')
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });

  if (questsError) {
    console.error('Error fetching accepted speculations:', questsError);
    throw questsError;
  }

  if (!quests || quests.length === 0) {
    return [];
  }

  // Get unique user IDs (sender and accepter)
  const userIds = [...new Set([
    ...quests.map(q => q.sender_id),
    ...quests.filter(q => q.speculation_accepter_id).map(q => q.speculation_accepter_id!)
  ])];

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
    receiver_profile: profileMap.get(quest.speculation_accepter_id || quest.receiver_id) || { full_name: null, email: 'Unknown' },
  })) as ArenaQuestWithProfiles[];
}

/**
 * Get resolved speculation quests for a group (recently completed)
 */
export async function getResolvedSpeculationsForGroup(
  groupId: string
): Promise<ArenaQuestWithProfiles[]> {
  // Get speculation quests that have been resolved
  const { data: quests, error: questsError } = await supabase
    .from('arena_quests')
    .select('*')
    .eq('group_id', groupId)
    .eq('quest_type', 'speculation')
    .eq('status', 'resolved')
    .order('updated_at', { ascending: false })
    .limit(10); // Show last 10 resolved speculations

  if (questsError) {
    console.error('Error fetching resolved speculations:', questsError);
    throw questsError;
  }

  if (!quests || quests.length === 0) {
    return [];
  }

  // Get unique user IDs (sender, accepter, and resolver)
  const userIds = [...new Set([
    ...quests.map(q => q.sender_id),
    ...quests.filter(q => q.speculation_accepter_id).map(q => q.speculation_accepter_id!),
    ...quests.filter(q => q.speculation_resolver_id).map(q => q.speculation_resolver_id!)
  ])];

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
    receiver_profile: profileMap.get(quest.speculation_accepter_id || quest.receiver_id) || { full_name: null, email: 'Unknown' },
  })) as ArenaQuestWithProfiles[];
}

/**
 * Get completed (resolved) quests for a group (non-speculation quests)
 */
export async function getCompletedQuestsForGroup(
  groupId: string
): Promise<ArenaQuestWithProfiles[]> {
  // Get quests that are resolved (excluding speculation which has its own function)
  const { data: quests, error: questsError } = await supabase
    .from('arena_quests')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'resolved')
    .neq('quest_type', 'speculation')
    .order('updated_at', { ascending: false })
    .limit(10); // Show last 10 completed quests

  if (questsError) {
    console.error('Error fetching completed quests:', questsError);
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
