import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { registerFCMToken } from './services/notifications';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    registerFCMToken();

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || ''
      );
    });

    return () => unsubscribe();
  }, []);

  return <AppNavigator />;
}

