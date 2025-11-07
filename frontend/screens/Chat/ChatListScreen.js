import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { fetchChats } from '../../services/chatService';

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchChats();
      setChats(data);
    } catch (err) {
      console.warn('fetchChats', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={chats}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Chat', { chatId: item.id, title: item.other_user_name })
            }
          >
            <View
              style={{
                padding: 14,
                borderBottomWidth: 1,
                borderColor: '#eee',
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontWeight: item.unread_count > 0 ? '700' : '500' }}>
                  {item.other_user_name}
                </Text>
                <Text numberOfLines={1} style={{ color: '#666' }}>
                  {item.last_message}
                </Text>
              </View>
              {item.unread_count > 0 && (
                <View
                  style={{
                    backgroundColor: '#0b7',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    justifyContent: 'center',
                    height: 28,
                    alignSelf: 'center',
                  }}
                >
                  <Text style={{ color: '#fff' }}>{item.unread_count}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

