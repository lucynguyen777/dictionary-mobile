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
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: inactiveColor,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 66,
          paddingTop: 8,
          borderTopColor: '#E5E5E5',
          backgroundColor: '#FFFFFF',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="word"
        options={{
          title: 'Dictionary',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'folder' : 'folder-outline'} size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="advanced"
        options={{
          title: 'Advanced',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'create' : 'create-outline'} size={25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
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
