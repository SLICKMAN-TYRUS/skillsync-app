import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudentDashboardScreen from '../studentDashboard/StudentDashboardScreen';
import GigsScreen from '../studentDashboard/GigsScreen';
import InboxScreen from '../studentDashboard/InboxScreen';
import CompletedGigsScreen from '../studentDashboard/CompletedGigsScreen';
import ProfileScreen from '../studentDashboard/ProfileScreen';
import GigDetailScreen from '../studentDashboard/GigDetailScreen';
import RateProviderScreen from '../studentDashboard/RateProviderScreen';
import ChatScreen from '../studentDashboard/ChatScreen';
import ApplicationConfirmationScreen from '../studentDashboard/ApplicationConfirmationScreen';
import NotificationsScreen from '../studentDashboard/NotificationsScreen';
import SavedGigsScreen from '../studentDashboard/SavedGigsScreen';
import MyApplicationsScreen from '../studentDashboard/MyApplicationsScreen';

const Stack = createNativeStackNavigator();

export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#0b72b9' }}>
      <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GigsScreen" component={GigsScreen} />
      <Stack.Screen name="GigDetailScreen" component={GigDetailScreen} />
      <Stack.Screen name="InboxScreen" component={InboxScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Stack.Screen name="CompletedGigsScreen" component={CompletedGigsScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="SavedGigsScreen" component={SavedGigsScreen} options={{ title: 'Saved Gigs' }} />
      <Stack.Screen name="MyApplicationsScreen" component={MyApplicationsScreen} options={{ title: 'My Applications' }} />
      <Stack.Screen name="RateProviderScreen" component={RateProviderScreen} />
      <Stack.Screen name="ApplicationConfirmationScreen" component={ApplicationConfirmationScreen} />
    </Stack.Navigator>
  );
}
