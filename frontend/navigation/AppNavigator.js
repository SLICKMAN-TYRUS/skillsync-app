import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import ApproveGigsScreen from '../screens/admin/ApproveGigsScreen';
import SystemLogsScreen from '../screens/admin/SystemLogsScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';

// Provider Screens
import ProviderDashboard from '../screens/provider/ProviderDashboard';
import PostGigScreen from '../screens/provider/PostGigScreen';
import ManageApplicationsScreen from '../screens/provider/ManageApplicationsScreen';
import RatingScreen from '../screens/provider/RatingScreen';

// Student Screens
import HomeScreen from '../screens/student/HomeScreen';
import GigDetailScreen from '../screens/student/GigDetailScreen';
import ApplicationStatusScreen from '../screens/student/ApplicationStatusScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import SignInScreen from '../screens/auth/SignInScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Admin Tab Navigator
const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Approve Gigs':
              iconName = 'approval';
              break;
            case 'Users':
              iconName = 'people';
              break;
            case 'Logs':
              iconName = 'assessment';
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Approve Gigs" component={ApproveGigsScreen} />
      <Tab.Screen name="Users" component={UserManagementScreen} />
      <Tab.Screen name="Logs" component={SystemLogsScreen} />
    </Tab.Navigator>
  );
};

// Provider Tab Navigator
const ProviderTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Post Gig':
              iconName = 'add-circle';
              break;
            case 'Applications':
              iconName = 'description';
              break;
            case 'Ratings':
              iconName = 'star';
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={ProviderDashboard} />
      <Tab.Screen name="Post Gig" component={PostGigScreen} />
      <Tab.Screen name="Applications" component={ManageApplicationsScreen} />
      <Tab.Screen name="Ratings" component={RatingScreen} />
    </Tab.Navigator>
  );
};

// Student Tab Navigator
const StudentTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Applications':
              iconName = 'description';
              break;
            case 'Profile':
              iconName = 'person';
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Applications" component={ApplicationStatusScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const QuickRoleSwitcher = ({ role, setRole }) => (
  <View style={styles.roleSwitcher}>
    {['student', 'provider', 'admin'].map(r => (
      <TouchableOpacity
        key={r}
        onPress={() => setRole(r)}
        style={[styles.roleButton, role === r && styles.roleButtonActive]}
      >
        <Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>{r}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const AppNavigator = () => {
  // This should be replaced with actual auth state management
  const [userRole, setUserRole] = useState('student'); // 'admin', 'provider', or 'student'

  return (
    <NavigationContainer>
      {/* Dev role switcher (visible in dev) */}
      <QuickRoleSwitcher role={userRole} setRole={setUserRole} />
      <Stack.Navigator>
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
        {userRole === 'admin' && (
          <Stack.Screen
            name="AdminTabs"
            component={AdminTabs}
            options={{ headerShown: false }}
          />
        )}
        {userRole === 'provider' && (
          <Stack.Screen
            name="ProviderTabs"
            component={ProviderTabs}
            options={{ headerShown: false }}
          />
        )}
        {userRole === 'student' && (
          <>
            <Stack.Screen
              name="StudentTabs"
              component={StudentTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GigDetail"
              component={GigDetailScreen}
              options={{ title: 'Gig Details' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  roleSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  roleButtonActive: {
    backgroundColor: '#0066CC',
  },
  roleButtonText: {
    color: '#333333',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
});
