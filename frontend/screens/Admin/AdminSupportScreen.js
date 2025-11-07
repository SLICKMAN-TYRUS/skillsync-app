import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator } from 'react-native';
import api from '../../services/api';

export default function AdminSupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function submitTicket() {
    if (!subject || !message) return alert('Please fill subject and message');
    setSending(true);
    try {
      await api.post('/support/ticket', { subject, message });
      alert('Ticket submitted — we will contact you via email.');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.warn('submit ticket', err);
      alert('Failed to submit ticket');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ marginBottom: 8 }}>Subject</Text>
      <TextInput
        value={subject}
        onChangeText={setSubject}
        placeholder="Short subject"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 8,
          borderRadius: 6,
          marginBottom: 12,
        }}
      />
      <Text style={{ marginBottom: 8 }}>Message</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Describe your issue"
        multiline
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 8,
          borderRadius: 6,
          minHeight: 120,
        }}
      />
      <View style={{ marginTop: 12 }}>
        {sending ? <ActivityIndicator /> : <Button title="Send to Support" onPress={submitTicket} />}
      </View>
    </View>
  );
}

