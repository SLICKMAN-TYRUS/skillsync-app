import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import NotificationsListScreen from '../screens/Notifications/NotificationsListScreen';
import NotificationSettingsScreen from '../screens/Notifications/NotificationSettingsScreen';
import IDUploadScreen from '../screens/Verification/IDUploadScreen';
import AdminSupportScreen from '../screens/Admin/AdminSupportScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: true }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
        <Stack.Screen name="Notifications" component={NotificationsListScreen} options={{ title: 'Notifications' }} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notification Settings' }} />
        <Stack.Screen name="IDUpload" component={IDUploadScreen} options={{ title: 'Upload ID' }} />
        <Stack.Screen name="AdminSupport" component={AdminSupportScreen} options={{ title: 'Support' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

