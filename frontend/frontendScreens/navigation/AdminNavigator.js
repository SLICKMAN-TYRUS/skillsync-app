import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../adminDashboard/AdminDashboard';
import ApproveGigsScreen from '../../screens/admin/ApproveGigsScreen';
import UserManagementScreen from '../../screens/admin/UserManagementScreen';
import SystemLogsScreen from '../../screens/admin/SystemLogsScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#0b72b9' }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ApproveGigs" component={ApproveGigsScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="SystemLogs" component={SystemLogsScreen} />
    </Stack.Navigator>
  );
}
