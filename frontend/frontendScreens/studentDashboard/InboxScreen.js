import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { ensureTestAuth } from '../../services/devAuth';
import apiClient, { chatApi } from '../../services/api';
import { formatTimestamp, getConversationTitle } from '../../components/chat/ChatThread';

const DEV_TEST_AUTH_ENABLED =
  (typeof __DEV__ !== 'undefined' && __DEV__) || (typeof process !== 'undefined' && process?.env?.ALLOW_DEV_TOKENS === 'true');

const safeTimeValue = (value) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const sortConversations = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .slice()
    .sort((a, b) => safeTimeValue(b?.last_message_at || b?.updated_at) - safeTimeValue(a?.last_message_at || a?.updated_at));
};

const buildErrorMessage = (error, fallback) => {
  if (!error) return fallback;
  const responseMessage = error?.response?.data?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage.trim();
  }
  const message = error?.message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }
  return fallback;
};

export default function InboxScreen() {
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const loadConversations = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }
    try {
      if (DEV_TEST_AUTH_ENABLED) {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }
      const [userResponse, conversationResponse] = await Promise.all([
        apiClient.get('/auth/me'),
        chatApi.listConversations(),
      ]);
      setCurrentUser(userResponse?.data || null);
      const conversationData = Array.isArray(conversationResponse?.data) ? conversationResponse.data : [];
      setConversations(sortConversations(conversationData));
      setError('');
    } catch (err) {
      console.error('Failed to load inbox', err);
      setError(buildErrorMessage(err, 'Failed to load conversations'));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadConversations({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadConversations]);

  const handleOpenConversation = useCallback(
    (conversationId) => {
      navigation.navigate('ChatScreen', { conversationId });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const titleText = getConversationTitle(item, currentUser?.id);
      const preview = item.last_message?.body || 'No messages yet';
      const timestamp = formatTimestamp(item.last_message_at || item.updated_at);
      return (
        <TouchableOpacity style={styles.card} onPress={() => handleOpenConversation(item.id)}>
          <View style={styles.cardHeader}>
            <Text style={styles.sender} numberOfLines={1}>
              {titleText}
            </Text>
            {item.unread_count ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread_count}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.preview} numberOfLines={2}>
            {preview}
          </Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </TouchableOpacity>
      );
    },
    [currentUser, handleOpenConversation]
  );

  const keyExtractor = useCallback((item) => item.id?.toString(), []);

  const emptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>When a provider or student messages you, it will appear here.</Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.wrapper}>
      <HeaderBack title="Inbox" backTo="StudentDashboard" />
      <ErrorBanner message={error} onClose={() => setError('')} />
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={emptyComponent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingBottom: 40,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#f2f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sender: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  preview: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  unreadBadge: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});