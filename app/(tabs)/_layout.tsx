import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Responsive sizing
  const isSmallPhone = width < 375;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const tabBarHeight = isTablet ? 72 : isSmallPhone ? 56 : 62;
  const iconSize = isTablet ? 26 : isSmallPhone ? 22 : 24;
  const fontSize = isTablet ? 12 : isSmallPhone ? 10 : 11;
  const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FAF8F5',
          borderTopWidth: 2.5,
          borderTopColor: '#2D3748',
          height: tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          paddingHorizontal: horizontalPadding,
          elevation: 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: '#1A202C',
        tabBarInactiveTintColor: '#A0AEC0',
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: fontSize,
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Maps',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}