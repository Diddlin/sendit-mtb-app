import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import SearchScreen from './src/screens/SearchScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const COLORS = { bg: '#0d0f14', surface: '#161b27', accent: '#ff6b35', text: '#e8edf5', muted: '#7a8699' };

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.bg, borderBottomColor: '#2a3347', borderBottomWidth: 1, elevation: 0, shadowOpacity: 0 },
              headerTintColor: COLORS.text,
              headerTitleStyle: { fontWeight: '800', fontSize: 18 },
              tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: '#2a3347', borderTopWidth: 1, height: 60, paddingBottom: 8 },
              tabBarActiveTintColor: COLORS.accent,
              tabBarInactiveTintColor: COLORS.muted,
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
          >
            <Tab.Screen
              name="Find Trails"
              component={SearchScreen}
              options={{
                title: '🚵 SendIt',
                tabBarLabel: 'Find Trails',
                tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🏔</Text>,
              }}
            />
            <Tab.Screen
              name="Saved"
              component={FavoritesScreen}
              options={{
                tabBarLabel: 'Saved',
                tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>❤️</Text>,
              }}
            />
            <Tab.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                tabBarLabel: 'Me',
                tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text>,
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
