import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../utils/colors';

interface AuthCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function AuthCard({ children, style }: AuthCardProps) {
  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <View style={styles.content}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  blur: {
    backgroundColor: colors.glassLight,
  },
  content: {
    padding: 32,
  },
});
