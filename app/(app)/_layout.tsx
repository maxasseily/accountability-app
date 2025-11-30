import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { colors } from '../../src/utils/colors';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        // Hide tab bar on nested screens within groups tab and post-comments
        // When navigating to groups/chat, groups/create, groups/join, or post-comments,
        // the navigation state will show the nested route name
        const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? 'index';
        const shouldHideTabBar =
          (route.name === 'groups' && focusedRouteName !== 'index') ||
          route.name === 'post-comments';

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
            <MaterialCommunityIcons
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
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "view-grid" : "view-grid-outline"}
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
            <MaterialCommunityIcons
              name={focused ? "account-group" : "account-group-outline"}
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
            <MaterialCommunityIcons
              name={focused ? "chart-line" : "chart-line-variant"}
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
        name="friends"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="post-comments"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
