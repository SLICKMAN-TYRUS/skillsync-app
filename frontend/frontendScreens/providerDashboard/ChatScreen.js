import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import HeaderBack from '../../components/HeaderBack';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'student',
      text: 'Hi! I’m excited to work on your gig.',
      timestamp: '2025-11-15 14:32',
    },
    {
      id: '2',
      sender: 'provider',
      text: 'Great! Let me know if you have any questions.',
      timestamp: '2025-11-15 14:34',
    },
    {
      id: '3',
      sender: 'admin',
      text: 'Reminder: gig deadline is tomorrow.',
      timestamp: '2025-11-15 15:00',
    },
  ]);

  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      sender: 'provider',
      text: input.trim(),
      timestamp: new Date().toLocaleString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
  };

  const renderMessage = ({ item }) => {
    const isProvider = item.sender === 'provider';
    const isAdmin = item.sender === 'admin';
    const bubbleStyle = isProvider
      ? styles.providerMessage
      : isAdmin
      ? styles.adminMessage
      : styles.studentMessage;

    return (
      <View style={[styles.messageContainer, bubbleStyle]}>
        <Text style={styles.senderLabel}>{item.sender.toUpperCase()}</Text>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <HeaderBack title="Chat" backTo="ProviderDashboard" />
      <FlatList
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  chatContainer: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  providerMessage: {
    backgroundColor: '#0077cc',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  studentMessage: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  adminMessage: {
    backgroundColor: '#ffe599',
    alignSelf: 'center',
    borderRadius: 12,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#000',
  },
  timestamp: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#0077cc',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});