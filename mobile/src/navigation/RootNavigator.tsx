import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import AddDiaperScreen from '../screens/AddDiaperScreen';
import AddFeedingScreen from '../screens/AddFeedingScreen';
import AddPumpScreen from '../screens/AddPumpScreen';
import AddSleepScreen from '../screens/AddSleepScreen';
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

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Timeline: { active: 'time', inactive: 'time-outline' },
  Family: { active: 'people', inactive: 'people-outline' },
};

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.feeding,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="Home" component={DashboardScreen} />
      <Tabs.Screen name="Timeline" component={TimelineScreen} />
      <Tabs.Screen name="Family" component={FamilyScreen} />
    </Tabs.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.feeding,
        headerTitleStyle: { fontWeight: '700', color: colors.textPrimary },
        headerShadowVisible: false,
      }}
    >
      <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Group screenOptions={{ presentation: 'modal' }}>
        <RootStack.Screen
          name="AddFeeding"
          component={AddFeedingScreen}
          options={({ route }) => ({ title: (route.params as any)?.entry ? 'Edit feeding' : 'Log feeding' })}
        />
        <RootStack.Screen
          name="AddPump"
          component={AddPumpScreen}
          options={({ route }) => ({ title: (route.params as any)?.entry ? 'Edit pump session' : 'Log pump session' })}
        />
        <RootStack.Screen
          name="AddSleep"
          component={AddSleepScreen}
          options={({ route }) => ({ title: (route.params as any)?.entry ? 'Edit sleep' : 'Log sleep' })}
        />
        <RootStack.Screen
          name="AddDiaper"
          component={AddDiaperScreen}
          options={({ route }) => ({ title: (route.params as any)?.entry ? 'Edit diaper change' : 'Log diaper change' })}
        />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.feeding} />
      </View>
    );
  }

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
