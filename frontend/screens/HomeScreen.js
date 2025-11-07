import React from 'react';
import { View, Text, Button, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 16 }}>Skillsync — Dev Menu</Text>

      <View style={{ width: '100%', marginBottom: 8 }}>
        <Button title="Messages" onPress={() => navigation.navigate('ChatList')} />
      </View>

      <View style={{ width: '100%', marginBottom: 8 }}>
        <Button title="Notifications" onPress={() => navigation.navigate('Notifications')} />
      </View>

      <View style={{ width: '100%', marginBottom: 8 }}>
        <Button title="Notification Settings" onPress={() => navigation.navigate('NotificationSettings')} />
      </View>

      <View style={{ width: '100%', marginBottom: 8 }}>
        <Button title="Upload ID" onPress={() => navigation.navigate('IDUpload')} />
      </View>

      <View style={{ width: '100%', marginBottom: 8 }}>
        <Button title="Support" onPress={() => navigation.navigate('AdminSupport')} />
      </View>
    </ScrollView>
  );
}

