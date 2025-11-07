import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { fetchMessages, connectSocket, subscribeToEvent, sendMessageREST } from '../../services/chatService';
import auth from '@react-native-firebase/auth';

export default function ChatScreen({ route, navigation }) {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: route.params.title || 'Chat' });
    let mounted = true;
    (async () => {
      try {
        const msgs = await fetchMessages(chatId);
        if (!mounted) return;
        const formatted = msgs.map(m => ({
          _id: m.id,
          text: m.text,
          createdAt: new Date(m.created_at),
          user: { _id: m.sender_id, name: m.sender_name },
        })).reverse();
        setMessages(formatted);
      } catch (err) {
        console.warn('fetchMessages', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    (async () => {
      try {
        const user = auth().currentUser;
        const token = user ? await user.getIdToken() : null;
        await connectSocket(token);
        subscribeToEvent('message', (m) => {
          if (m.chatId === chatId) {
            const formatted = {
              _id: m.id,
              text: m.text,
              createdAt: new Date(m.created_at),
              user: { _id: m.sender_id, name: m.sender_name }
            };
            setMessages(prev => GiftedChat.append(prev, formatted));
          }
        });
      } catch (err) {
        console.warn('socket connect error', err);
      }
    })();

    return () => { mounted = false; };
  }, [chatId, navigation, route.params.title]);

  const onSend = useCallback(async (msgs = []) => {
    const [m] = msgs;
    setMessages(prev => GiftedChat.append(prev, m));
    try {
      await sendMessageREST(chatId, m.text);
    } catch (err) {
      console.warn('send message failed', err);
    }
  }, [chatId]);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );

  return (
    <GiftedChat
      messages={messages}
      onSend={(msgs) => onSend(msgs)}
      user={{ _id: auth().currentUser ? auth().currentUser.uid : 'anon' }}
      placeholder="Type a message..."
    />
  );
}

