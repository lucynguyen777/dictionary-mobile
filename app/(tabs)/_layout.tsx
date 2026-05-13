import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';

const inactiveColor = '#B7B7B7';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: inactiveColor,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          borderTopColor: '#E5E7EB',
          elevation: 12,
          backgroundColor: '#FFFFFF',
          height: 74,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#0F172A',
          shadowOffset: { height: -4, width: 0 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="word"
        options={{
          title: 'Tra cứu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search-circle' : 'search-circle-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Tủ từ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'folder' : 'folder-outline'} size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="advanced"
        options={{
          title: 'Luyện tập',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flash' : 'flash-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
