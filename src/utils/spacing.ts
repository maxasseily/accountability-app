/**
 * Spacing Constants
 *
 * Provides consistent spacing values across the application.
 * Use these constants instead of hard-coded values for better maintainability.
 */

export const spacing = {
  // Base unit (8px grid system)
  unit: 8,

  // Screen-level padding values
  // For main tab screens (home, groups, statistics)
  screenPaddingTop: 48,
  // Reduced top padding when safe-area offsets are applied
  screenPaddingTopCompact: 12,
  screenPaddingHorizontal: 24,
  screenPaddingBottom: 120, // Accommodates floating tab bar (75px + margin + extra space)

  // For form/modal screens (create group, join group, onboarding)
  screenPaddingTopForm: 80,

  // For screens with custom headers (chat)
  screenPaddingTopWithHeader: 90,

  // Component spacing scale
  paddingXs: 8,
  paddingSmall: 12,
  paddingMedium: 16,
  paddingLarge: 20,
  paddingXl: 24,
  paddingXxl: 32,
};
