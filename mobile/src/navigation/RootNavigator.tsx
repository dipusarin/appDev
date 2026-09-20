import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AddDiaperScreen from '../screens/AddDiaperScreen';
import AddFeedingScreen from '../screens/AddFeedingScreen';
import AddPumpScreen from '../screens/AddPumpScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FamilyScreen from '../screens/FamilyScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TimelineScreen from '../screens/TimelineScreen';

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{symbol}</Text>;
}

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#7B61C7' }}>
      <Tabs.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="🏠" focused={focused} /> }}
      />
      <Tabs.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="📋" focused={focused} /> }}
      />
      <Tabs.Screen
        name="Family"
        component={FamilyScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon symbol="👪" focused={focused} /> }}
      />
    </Tabs.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Group screenOptions={{ presentation: 'modal', headerShown: true }}>
        <RootStack.Screen name="AddFeeding" component={AddFeedingScreen} options={{ title: 'Log feeding' }} />
        <RootStack.Screen name="AddPump" component={AddPumpScreen} options={{ title: 'Log pump session' }} />
        <RootStack.Screen name="AddDiaper" component={AddDiaperScreen} options={{ title: 'Log diaper change' }} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F2' }}>
        <ActivityIndicator size="large" color="#7B61C7" />
      </View>
    );
  }

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
