import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import notificationService from '../services/notifications';

const NotificationsModal = ({ visible, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const recent = await notificationService.getRecent(50);
    setItems(recent || []);
    setLoading(false);
  };

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  const markAsRead = async (id) => {
    await notificationService.markRead(id);
    await load();
  };

  const markAll = async () => {
    await notificationService.markAllRead();
    await load();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={markAll} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading && (
            <View style={styles.empty}>
              <Text>Loading…</Text>
            </View>
          )}

          {!loading && items.length === 0 && (
            <View style={styles.empty}>
              <Text>No notifications</Text>
            </View>
          )}

          <FlatList
            data={items}
            keyExtractor={(i) => `${i.id}`}
            renderItem={({ item }) => (
              <View style={[styles.item, item.read ? styles.read : styles.unread]}>
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemMessage}>{item.message}</Text>
                  <Text style={styles.itemMeta}>{item.created_at}</Text>
                </View>
                {!item.read && (
                  <TouchableOpacity onPress={() => markAsRead(item.id)} style={styles.markButton}>
                    <Text style={styles.markText}>Mark</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '92%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  title: { fontSize: 18, fontWeight: '700' },
  empty: { padding: 24, alignItems: 'center' },
  item: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  unread: { backgroundColor: '#fff' },
  read: { backgroundColor: '#FAFAFA' },
  itemBody: { flex: 1 },
  itemTitle: { fontWeight: '700' },
  itemMessage: { color: '#333', marginTop: 6 },
  itemMeta: { color: '#999', marginTop: 6, fontSize: 12 },
  markButton: { paddingHorizontal: 8, paddingVertical: 6 },
  markText: { color: '#0066CC', fontWeight: '700' },
});

export default NotificationsModal;
