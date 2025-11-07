// components/MessageBubble.js
import React from 'react';
import { View, Text } from 'react-native';

export default function MessageBubble({ text, isMe, time, style }) {
  return (
    <View style={{
      alignSelf: isMe ? 'flex-end' : 'flex-start',
      backgroundColor: isMe ? '#0b7' : '#eee',
      padding: 10,
      borderRadius: 12,
      marginVertical: 6,
      maxWidth: '80%',
      ...style
    }}>
      <Text style={{ color: isMe ? '#fff' : '#222' }}>{text}</Text>
      {time && <Text style={{ fontSize: 10, color: isMe ? '#e6fff5' : '#666', marginTop: 6 }}>{new Date(time).toLocaleTimeString()}</Text>}
    </View>
  );
}

