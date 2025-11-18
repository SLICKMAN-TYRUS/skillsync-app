import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProviderDashboardScreen from '../providerDashboard/ProviderDashboardScreen';
import PostGigScreen from '../providerDashboard/PostGigScreen';
import ManageGigsScreen from '../providerDashboard/ManageGigsScreen';
import ReviewApplicationsScreen from '../providerDashboard/ReviewApplicationsScreen';
import RateStudentsScreen from '../providerDashboard/RateStudentsScreen';
import ChatScreen from '../providerDashboard/ChatScreen';
import ProfileScreen from '../providerDashboard/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function ProviderNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#0b72b9' }}>
      <Stack.Screen name="ProviderDashboard" component={ProviderDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PostGig" component={PostGigScreen} />
      <Stack.Screen name="ManageGigs" component={ManageGigsScreen} />
      <Stack.Screen name="ReviewApplications" component={ReviewApplicationsScreen} />
      <Stack.Screen name="RateStudents" component={RateStudentsScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
