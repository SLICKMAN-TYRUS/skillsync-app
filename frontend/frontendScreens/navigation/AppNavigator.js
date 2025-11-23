import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import RoleBasedNavigator from './RoleBasedNavigator';
import ToastHost from '../../components/ToastHost';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="RoleBased" component={RoleBasedNavigator} />
      </Stack.Navigator>
      <ToastHost />
    </>
  );
}
