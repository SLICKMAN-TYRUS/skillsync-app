// screens/InboxScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { useNavigation } from '@react-navigation/native';

const messages = [
  {
    id: '1',
    sender: 'Aline Mukamana',
    subject: 'Follow-up on your application',
    preview: 'Hi, thanks for applying to our Musanze campaign. Can we schedule a quick call?',
    timestamp: 'Nov 14, 2025',
  },
  {
    id: '2',
    sender: 'Jean Bosco Niyonzima',
    subject: 'Portfolio request',
    preview: 'Could you share your latest design samples before Friday?',
    timestamp: 'Nov 13, 2025',
  },
  {
    id: '3',
    sender: 'SkillSync Admin',
    subject: 'System update',
    preview: 'We’ve added new gigs in Kigali and Rubavu. Check them out!',
    timestamp: 'Nov 12, 2025',
  },
  {
    id: '4',
    sender: 'Sandrine Uwizeye',
    subject: 'Interview confirmation',
    preview: 'Your interview for the Norseken website project is confirmed for Monday at 10am.',
    timestamp: 'Nov 11, 2025',
  },
];

export default function InboxScreen() {
  const navigation = useNavigation();
  const [error, setError] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Inbox" backTo="StudentDashboard" />
        <ErrorBanner message={error} onClose={() => setError('')} />
        <Text style={styles.title}>Inbox</Text>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ChatScreen', { sender: item.sender })}
            >
              <Text style={styles.sender}>{item.sender}</Text>
              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.preview}>{item.preview}</Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  container: {
    width: '90%',
    maxWidth: 500,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f2f8ff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  sender: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  subject: {
    fontSize: 15,
    color: '#0077cc',
    marginTop: 4,
  },
  preview: {
    fontSize: 14,
    color: '#444',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'right',
  },
});