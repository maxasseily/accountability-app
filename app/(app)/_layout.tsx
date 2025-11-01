import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { colors } from '../../src/utils/colors';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        // Hide tab bar on nested screens within groups tab
        // When navigating to groups/chat, groups/create, or groups/join,
        // the navigation state will show the nested route name
        const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? 'index';
        const shouldHideTabBar =
          route.name === 'groups' && focusedRouteName !== 'index';

        return {
          headerShown: false,
          tabBarStyle: shouldHideTabBar
            ? { display: 'none' }
            : {
                position: 'absolute',
                backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.glassLight,
                borderTopColor: colors.glassBorder,
                borderTopWidth: 1,
                height: 75,
                paddingBottom: 10,
                paddingTop: 10,
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                ...Platform.select({
                  ios: {
                    shadowColor: colors.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                  },
                  android: {
                    elevation: 8,
                  },
                }),
              },
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView
                intensity={40}
                style={StyleSheet.absoluteFill}
                tint="dark"
              />
            ) : null,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        };
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={focused ? 26 : 24}
              color={color}
              style={{
                textShadowColor: focused ? colors.accent : 'transparent',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: focused ? 8 : 0,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Group',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={focused ? 26 : 24}
              color={color}
              style={{
                textShadowColor: focused ? colors.accent : 'transparent',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: focused ? 8 : 0,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              size={focused ? 26 : 24}
              color={color}
              style={{
                textShadowColor: focused ? colors.accent : 'transparent',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: focused ? 8 : 0,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
