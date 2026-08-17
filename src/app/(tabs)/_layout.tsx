import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Color } from '@/design-system/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Color.accentPrimary,
        tabBarInactiveTintColor: Color.textSecondary,
        tabBarStyle: { backgroundColor: Color.surface, borderTopColor: Color.surfaceElevated },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="voice"
        options={{
          title: 'Voice',
          tabBarIcon: ({ color, size }) => <Ionicons name="mic-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fitness"
        options={{
          title: 'Fitness',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: 'Growth',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color, size }) => <Ionicons name="alarm-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="skincare"
        options={{
          title: 'Skincare',
          tabBarIcon: ({ color, size }) => <Ionicons name="water-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
