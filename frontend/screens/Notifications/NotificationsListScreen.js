import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { fetchNotifications, markNotificationRead, registerFCMToken } from '../../services/notifications';

export default function NotificationsListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    registerFCMToken();
    load();
  }, []);

  async function load() {
    try {
      const data = await fetchNotifications();
      setItems(data);
    } catch (err) {
      console.warn('Failed to load notifications', err);
    }
  }

  async function onPressItem(item) {
    await markNotificationRead(item.id);
    setItems((prev) => prev.map(p => p.id === item.id ? { ...p, read: true } : p));
  }

  return (
    <View style={{flex:1}}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onPressItem(item)}>
            <View style={{ padding: 14, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: item.read ? '#fff' : '#f7fbff' }}>
              <Text style={{ fontWeight: item.read ? '400' : '700' }}>{item.title}</Text>
              <Text numberOfLines={2} style={{ color: '#444', marginTop:6 }}>{item.body}</Text>
              <Text style={{ fontSize: 12, color: '#999', marginTop:8 }}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

