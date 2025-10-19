import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { colors } from '../../utils/colors';
import type { GroupMemberWithProfile } from '../../types/groups';
import { getLatestPhotoForUser, type DailyPhoto } from '../../utils/dailyPhoto';

interface MemberListProps {
  members: GroupMemberWithProfile[];
  currentUserId: string;
}

interface MemberItemProps {
  member: GroupMemberWithProfile;
  isCurrentUser: boolean;
  onPhotoPress: (photo: DailyPhoto, memberName: string) => void;
}

function MemberItem({ member, isCurrentUser, onPhotoPress }: MemberItemProps) {
  const { profile } = member;
  const displayName = profile.full_name || profile.email.split('@')[0] || 'User';
  const [latestPhoto, setLatestPhoto] = useState<DailyPhoto | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);

  // Load the member's latest photo
  const loadPhoto = useCallback(async () => {
    try {
      setIsLoadingPhoto(true);
      const photo = await getLatestPhotoForUser(member.user_id);
      setLatestPhoto(photo);
    } catch (error) {
      console.error('Error loading member photo:', error);
    } finally {
      setIsLoadingPhoto(false);
    }
  }, [member.user_id]);

  // Refresh photo when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPhoto();
    }, [loadPhoto])
  );

  return (
    <View style={styles.memberItem}>
      {/* Daily Photo */}
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => latestPhoto && onPhotoPress(latestPhoto, displayName)}
        disabled={!latestPhoto}
        activeOpacity={0.7}
      >
        {isLoadingPhoto ? (
          <View style={styles.photoPlaceholder}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : latestPhoto ? (
          <Image
            source={{ uri: latestPhoto.photo_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>📷</Text>
          </View>
        )}
        {isCurrentUser && (
          <View style={styles.youBadge}>
            <Text style={styles.youBadgeText}>YOU</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{displayName}</Text>
        {profile.rank && (
          <Text style={styles.memberRank}>{profile.rank}</Text>
        )}
      </View>
    </View>
  );
}

export default function MemberList({ members, currentUserId }: MemberListProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<{ photo: DailyPhoto; name: string } | null>(null);

  const handlePhotoPress = (photo: DailyPhoto, memberName: string) => {
    setSelectedPhoto({ photo, name: memberName });
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Members</Text>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.gradient}>
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MemberItem
                member={item}
                isCurrentUser={item.user_id === currentUserId}
                onPhotoPress={handlePhotoPress}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
          />
        </View>
      </BlurView>

      {/* Photo Enlargement Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <View style={styles.modalContent}>
            {selectedPhoto && (
              <>
                <Text style={styles.modalTitle}>{selectedPhoto.name}</Text>
                <Image
                  source={{ uri: selectedPhoto.photo.photo_url }}
                  style={styles.enlargedPhoto}
                  resizeMode="contain"
                />
                <Text style={styles.modalDate}>
                  {new Date(selectedPhoto.photo.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  gradient: {
    padding: 16,
    backgroundColor: colors.glassLight,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.glassDark,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 24,
    opacity: 0.5,
  },
  youBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.backgroundStart,
    letterSpacing: 0.5,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  memberRank: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginLeft: 64,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  enlargedPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  modalDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
