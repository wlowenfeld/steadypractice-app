import React from 'react';
import { Tabs } from 'expo-router';
import { Users, Calendar, Settings, LayoutDashboard } from 'lucide-react-native';
import { View } from 'react-native';
import { useTheme } from '@/lib/theme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 0.5,
          borderTopColor: colors.tabBarBorder,
          height: 85,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'opacity-100' : 'opacity-70'}>
              <LayoutDashboard size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'opacity-100' : 'opacity-70'}>
              <Users size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'opacity-100' : 'opacity-70'}>
              <Calendar size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'opacity-100' : 'opacity-70'}>
              <Settings size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
