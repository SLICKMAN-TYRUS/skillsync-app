import React from 'react';
import StudentNavigator from './StudentNavigator';
import ProviderNavigator from './ProviderNavigator';
import AdminNavigator from './AdminNavigator';
import AuthNavigator from './AuthNavigator';

export default function RoleBasedNavigator({ route }) {
  // Be defensive: route or route.params may be undefined (web HMR or direct mounts)
  const role = route && route.params && route.params.role ? route.params.role : null;

  if (!role) {
    // If no role provided, fall back to the Auth flow to let the user choose a role.
    // This avoids crashes when the navigator is mounted without params.
    return <AuthNavigator />;
  }

  switch (role) {
    case 'Student':
      return <StudentNavigator />;
    case 'Provider':
      return <ProviderNavigator />;
    case 'Admin':
      return <AdminNavigator />;
    default:
      return <AuthNavigator />;
  }
}
