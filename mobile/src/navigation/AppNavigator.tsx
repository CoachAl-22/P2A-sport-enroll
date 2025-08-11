import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import ClassesScreen from '../screens/ClassesScreen';
import ClassDetailsScreen from '../screens/ClassDetailsScreen';
import EnrollmentScreen from '../screens/EnrollmentScreen';
import WaitlistScreen from '../screens/WaitlistScreen';
import HighPerformanceScreen from '../screens/HighPerformanceScreen';
import EducationScreen from '../screens/EducationScreen';
import LoginScreen from '../screens/LoginScreen';

// Auth Hook
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ClassesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ClassesList" 
        component={ClassesScreen} 
        options={{ title: 'Classes' }}
      />
      <Stack.Screen 
        name="ClassDetails" 
        component={ClassDetailsScreen} 
        options={{ title: 'Class Details' }}
      />
      <Stack.Screen 
        name="Enrollment" 
        component={EnrollmentScreen} 
        options={{ title: 'Enroll' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap;

          if (route.name === 'My Family') {
            iconName = 'dashboard';
          } else if (route.name === 'Programs') {
            iconName = 'sports';
          } else if (route.name === 'Waitlists') {
            iconName = 'schedule';
          } else if (route.name === 'High Performance') {
            iconName = 'emoji-events';
          } else if (route.name === 'Education') {
            iconName = 'school';
          } else {
            iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="My Family" component={DashboardScreen} />
      <Tab.Screen name="Programs" component={ClassesStack} />
      <Tab.Screen name="Waitlists" component={WaitlistScreen} />
      <Tab.Screen name="High Performance" component={HighPerformanceScreen} />
      <Tab.Screen name="Education" component={EducationScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Show loading screen
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}