import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ErrorBanner from '../ErrorBanner';
import HeaderBack from '../HeaderBack';
import { ensureTestAuth } from '../../services/devAuth';
import apiClient, { chatApi } from '../../services/api';
import { getSharedEventStream } from '../../services/eventStream';

const DEV_TEST_AUTH_ENABLED =
  (typeof __DEV__ !== 'undefined' && __DEV__) || (typeof process !== 'undefined' && process?.env?.ALLOW_DEV_TOKENS === 'true');

const nextFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb) => setTimeout(cb, 0);

const safeTimeValue = (value) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const sortConversations = (items) => {
  if (!Array.isArray(items)) return [];
  const copy = items.slice();
  copy.sort((a, b) => {
    const bTime = safeTimeValue(b?.last_message_at || b?.updated_at || b?.created_at);
    const aTime = safeTimeValue(a?.last_message_at || a?.updated_at || a?.created_at);
    return bTime - aTime;
  });
  return copy;
};

export const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString();
};

export const getConversationTitle = (conversation, currentUserId) => {
  if (!conversation) {
    return 'Conversation';
  }
  if (conversation.subject) {
    return conversation.subject;
  }
  const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
  const others = participants
    .filter((participant) => participant?.user_id && participant.user_id !== currentUserId)
    .map((participant) => {
      const user = participant.user || {};
      return user.name || user.email || `User ${participant.user_id}`;
    })
    .filter(Boolean);
  if (others.length > 0) {
    return others.join(', ');
  }
  const fallbackUser = participants[0]?.user;
  if (fallbackUser?.name) {
    return fallbackUser.name;
  }
  return `Conversation #${conversation.id}`;
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

const useRouteConversationId = (route) => {
  const param = route?.params?.conversationId;
  if (param === undefined || param === null) {
    return null;
  }
  const parsed = Number(param);
  return Number.isNaN(parsed) ? null : parsed;
};

const ChatThread = ({
  title = 'Chat',
  backTo,
  defaultTestUid,
  defaultTestRole,
  route,
}) => {
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const messageListRef = useRef(null);
  const routeConversationId = useMemo(() => useRouteConversationId(route), [route]);

  const loadConversations = useCallback(
    async (options = {}) => {
      const { silent = false } = options;
      if (!silent) {
        setLoadingConversations(true);
      }
      try {
        if (DEV_TEST_AUTH_ENABLED && defaultTestUid && defaultTestRole) {
          await ensureTestAuth(defaultTestUid, defaultTestRole);
        }
        const [userResponse, conversationResponse] = await Promise.all([
          apiClient.get('/auth/me'),
          chatApi.listConversations(),
        ]);
        const me = userResponse?.data || null;
        const conversationData = Array.isArray(conversationResponse?.data)
          ? conversationResponse.data
          : [];
        const sorted = sortConversations(conversationData);
        setCurrentUser(me);
        setConversations(sorted);
        setError('');
        setSelectedConversationId((prev) => {
          if (routeConversationId && sorted.some((item) => item.id === routeConversationId)) {
            return routeConversationId;
          }
          if (prev && sorted.some((item) => item.id === prev)) {
            return prev;
          }
          return sorted.length > 0 ? sorted[0].id : null;
        });
        if (sorted.length === 0) {
          setMessages([]);
        }
        return sorted;
      } catch (err) {
        console.error('Failed to load conversations', err);
        setError(buildErrorMessage(err, 'Failed to load conversations'));
        return [];
      } finally {
        if (!silent) {
          setLoadingConversations(false);
        }
      }
    },
    [defaultTestRole, defaultTestUid, routeConversationId]
  );

  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        setMessages([]);
        return;
      }
      setLoadingMessages(true);
      try {
        const response = await chatApi.fetchMessages(conversationId, { limit: 100 });
        const data = Array.isArray(response?.data) ? response.data : [];
        setMessages(data);
        setError('');
        try {
          await chatApi.markRead(conversationId);
          setConversations((prev) =>
            prev.map((item) =>
              item.id === conversationId ? { ...item, unread_count: 0 } : item
            )
          );
        } catch (err) {
          // Marking as read is best-effort; swallow errors but log for troubleshooting.
          console.warn('Failed to mark conversation read', err);
        }
      } catch (err) {
        console.error('Failed to load messages', err);
        setError(buildErrorMessage(err, 'Failed to load messages'));
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }
    loadMessages(selectedConversationId);
  }, [selectedConversationId, loadMessages]);

  useEffect(() => {
    if (!routeConversationId) {
      return;
    }
    if (conversations.some((item) => item.id === routeConversationId)) {
      setSelectedConversationId(routeConversationId);
    }
  }, [conversations, routeConversationId]);

  useEffect(() => {
    if (Platform.OS !== 'web' && typeof EventSource === 'undefined') {
      return;
    }
    let unsubscribe;
    try {
      const client = getSharedEventStream();
      const handler = (payload) => {
        if (!payload || !payload.message) {
          return;
        }
        const conversationId = payload.conversation_id || payload.message.conversation_id;
        if (!conversationId) {
          return;
        }
        if (!conversations.some((item) => item.id === conversationId)) {
          loadConversations({ silent: true });
          return;
        }
        setConversations((prev) => {
          const index = prev.findIndex((item) => item.id === conversationId);
          if (index === -1) {
            return prev;
          }
          const existing = prev[index];
          const updated = {
            ...existing,
            last_message: payload.message,
            last_message_at: payload.last_message_at || payload.message.created_at,
          };
          const isOwnMessage = currentUser && payload.message.sender_id === currentUser.id;
          const isActiveConversation = conversationId === selectedConversationId;
          updated.unread_count = isOwnMessage || isActiveConversation ? 0 : (existing.unread_count || 0) + 1;
          const next = prev.slice();
          next[index] = updated;
          return sortConversations(next);
        });
        if (conversationId === selectedConversationId) {
          setMessages((prev) => {
            if (prev.some((message) => message.id === payload.message.id)) {
              return prev;
            }
            return [...prev, payload.message];
          });
        }
      };
      unsubscribe = client.on('chat_message', handler);
    } catch (err) {
      console.warn('Chat stream unavailable', err);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [conversations, currentUser, loadConversations, selectedConversationId]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }
    if (messageListRef.current && messageListRef.current.scrollToEnd) {
      nextFrame(() => {
        messageListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages]);

  const handleSelectConversation = (conversationId) => {
    if (conversationId === selectedConversationId) {
      return;
    }
    setSelectedConversationId(conversationId);
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !selectedConversationId || sending) {
      return;
    }
    setSending(true);
    try {
      const response = await chatApi.postMessage(selectedConversationId, { body: trimmed });
      const message = response?.data;
      if (message) {
        setMessages((prev) => [...prev, message]);
        setConversations((prev) => {
          const index = prev.findIndex((item) => item.id === selectedConversationId);
          if (index === -1) {
            return prev;
          }
          const updated = {
            ...prev[index],
            last_message: message,
            last_message_at: message.created_at,
            unread_count: 0,
          };
          const next = prev.slice();
          next[index] = updated;
          return sortConversations(next);
        });
      }
      setInputValue('');
      setError('');
    } catch (err) {
      console.error('Failed to send message', err);
      setError(buildErrorMessage(err, 'Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const renderConversationItem = ({ item }) => {
    const isActive = item.id === selectedConversationId;
    const titleText = getConversationTitle(item, currentUser?.id);
    const previewText = item.last_message?.body || 'No messages yet';
    const timestamp = formatTimestamp(item.last_message_at || item.updated_at);
    return (
      <TouchableOpacity
        style={[styles.conversationItem, isActive && styles.conversationItemActive]}
        onPress={() => handleSelectConversation(item.id)}
        accessible
        accessibilityRole="button"
      >
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationTitle, isActive && styles.conversationTitleActive]} numberOfLines={1}>
            {titleText}
          </Text>
          {item.unread_count ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.conversationPreview} numberOfLines={2}>
          {previewText}
        </Text>
        <Text style={styles.conversationTimestamp}>{timestamp}</Text>
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }) => {
    const isOwn = currentUser && item.sender_id === currentUser.id;
    const bubbleStyles = [styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubblePeer];
    return (
      <View style={bubbleStyles}>
        {!isOwn ? (
          <Text style={styles.messageSender}>{item.sender?.name || item.sender?.role || `User ${item.sender_id}`}</Text>
        ) : null}
        <Text style={styles.messageBody}>{item.body}</Text>
        <Text style={styles.messageTimestamp}>{formatTimestamp(item.created_at)}</Text>
      </View>
    );
  };

  const footerDisabled = !inputValue.trim() || !selectedConversationId || sending;

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        <HeaderBack title={title} backTo={backTo} />
        <ErrorBanner message={error} onClose={() => setError('')} />
        <View style={styles.content}>
          <View style={styles.conversationList}>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>Conversations</Text>
              <TouchableOpacity onPress={() => loadConversations({ silent: false })} style={styles.refreshButton}>
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            {loadingConversations ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={(item) => item.id?.toString()}
                renderItem={renderConversationItem}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No conversations yet</Text>
                    <Text style={styles.emptySubtitle}>Messages you receive will appear here.</Text>
                  </View>
                }
                style={styles.conversationFlatList}
                contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : null}
              />
            )}
          </View>
          <View style={styles.threadContainer}>
            {selectedConversation ? (
              <View style={styles.threadHeader}>
                <Text style={styles.threadTitle}>{getConversationTitle(selectedConversation, currentUser?.id)}</Text>
                {selectedConversation.gig_id ? (
                  <Text style={styles.threadMeta}>Gig #{selectedConversation.gig_id}</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.threadHeader}>
                <Text style={styles.threadTitle}>Start a conversation</Text>
              </View>
            )}
            {loadingMessages ? (
              <View style={styles.loadingThread}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : (
              <FlatList
                ref={messageListRef}
                data={messages}
                keyExtractor={(item) => item.id?.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageListContent}
                ListEmptyComponent={
                  <View style={styles.emptyThread}>
                    <Text style={styles.emptyTitle}>No messages yet</Text>
                    <Text style={styles.emptySubtitle}>Say hello to start the conversation.</Text>
                  </View>
                }
              />
            )}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={selectedConversation ? 'Type your message…' : 'Select a conversation to start chatting'}
                value={inputValue}
                onChangeText={setInputValue}
                editable={!!selectedConversationId && !sending}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, footerDisabled && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={footerDisabled}
              >
                <Text style={[styles.sendText, footerDisabled && styles.sendTextDisabled]}>
                  {sending ? 'Sending…' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  content: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: Platform.OS === 'web' ? 16 : 12,
    marginTop: 12,
    marginBottom: 16,
  },
  conversationList: {
    width: Platform.OS === 'web' ? 300 : '100%',
    backgroundColor: '#eef5ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#d4e3fb',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#cbdcf9',
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  conversationFlatList: {
    flexGrow: 0,
  },
  conversationItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  conversationItemActive: {
    borderColor: '#2563eb',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  conversationTitleActive: {
    color: '#1d4ed8',
  },
  conversationPreview: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  conversationTimestamp: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  threadContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  threadHeader: {
    marginBottom: 12,
  },
  threadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  threadMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  loadingThread: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageListContent: {
    paddingBottom: 80,
  },
  emptyThread: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageBubbleOwn: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
  },
  messageBubblePeer: {
    backgroundColor: '#e2e8f0',
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  messageBody: {
    fontSize: 14,
    color: '#0f172a',
  },
  messageTimestamp: {
    fontSize: 11,
    color: '#475569',
    marginTop: 6,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  sendButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
  },
  sendTextDisabled: {
    color: '#e2e8f0',
  },
});

export default ChatThread;
