// screens/ChatScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';

export default function ChatScreen({ route }) {
  // General chat available to students, providers and admin
  const currentUser = 'You';
  const [messages, setMessages] = useState([
    { id: '1', from: 'Admin', text: 'Welcome to the General Chat — please follow community rules.' },
    { id: '2', from: 'Provider: Aline', text: 'We have a new frontend gig open for applications.' },
    { id: '3', from: 'You', text: 'Thanks — I will check it out.' },
  ]);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);
  const [error, setError] = useState('');

  const sendMessage = () => {
    try {
      if (input.trim()) {
        setMessages((m) => [...m, { id: Date.now().toString(), from: currentUser, text: input }]);
        setInput('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      console.error('Send message failed', err);
      setError('Failed to send message');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
  <HeaderBack title="General Chat" backTo="StudentDashboard" />
  <ErrorBanner message={error} onClose={() => setError('')} />
  <Text style={styles.title}>General Chat</Text>

  {/* Participants */}
  <View style={styles.participantsRow}>
    <Text style={styles.participant}>Admin</Text>
    <Text style={styles.participant}>Providers</Text>
    <Text style={styles.participant}>Students</Text>
  </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.from === 'You' ? styles.userBubble : (item.from === 'Admin' ? styles.adminBubble : styles.senderBubble),
              ]}
            >
              <Text style={[styles.messageText, item.from === 'Admin' && styles.adminText]}>
                {item.from !== 'You' && <Text style={styles.fromLabel}>{item.from}: </Text>}
                {item.text}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.chatArea}
        />

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 10,
    textAlign: 'center',
  },
  chatArea: {
    paddingBottom: 100,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    maxWidth: '80%',
  },
  senderBubble: {
    backgroundColor: '#f2f8ff',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#0077cc',
    alignSelf: 'flex-end',
  },
  messageText: {
    color: '#fff',
  },
  inputArea: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    height: 40,
  },
  sendButton: {
    backgroundColor: '#0077cc',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 6,
    marginLeft: 8,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  participantsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  participant: {
    backgroundColor: '#eef6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    color: '#0077cc',
    fontWeight: '600',
  },
  adminBubble: {
    backgroundColor: '#fff4e5',
    alignSelf: 'flex-start',
  },
  adminText: {
    color: '#333',
  },
  fromLabel: {
    fontWeight: '700',
    color: '#0b3b5a',
  },
});