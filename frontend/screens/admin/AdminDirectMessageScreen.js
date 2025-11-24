import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HeaderBack from '../../components/HeaderBack';

const buildSeedConversation = (user) => {
  if (!user) {
    return [];
  }
  const friendlyName = user.name || 'User';
  return [
    {
      id: 'seed-1',
      sender: 'user',
      body: `Hi admin, I had a quick question about my account.`,
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'seed-2',
      sender: 'admin',
      body: `Hey ${friendlyName.split(' ')[0] || 'there'}! Happy to help—what do you need?`,
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ];
};

const formatTime = (isoString) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return '';
  }
};

const AdminDirectMessageScreen = ({ route, navigation }) => {
  const user = route?.params?.user;
  const [messages, setMessages] = useState(() => buildSeedConversation(user));
  const [draft, setDraft] = useState('');

  const headerTitle = useMemo(() => {
    if (!user) {
      return 'Direct Message';
    }
    const name = user.name || 'User';
    return name.length > 26 ? `${name.slice(0, 23)}…` : name;
  }, [user]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    const timestamp = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { id: `local-${timestamp}`, sender: 'admin', body: trimmed, timestamp },
    ]);
    setDraft('');
  };

  const renderMessage = ({ item }) => {
    const isAdmin = item.sender === 'admin';
    return (
      <View style={[styles.messageRow, isAdmin ? styles.adminRow : styles.userRow]}>
        {!isAdmin ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
        ) : null}
        <View style={[styles.messageBubble, isAdmin ? styles.adminBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isAdmin && styles.adminText]}>{item.body}</Text>
          <Text style={[styles.messageTimestamp, isAdmin && styles.adminTimestamp]}>{formatTime(item.timestamp)}</Text>
        </View>
        {isAdmin ? (
          <View style={styles.adminIconWrap}>
            <Icon name="shield" size={16} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <HeaderBack title={headerTitle} backTo="UserManagement" />
      {!user ? (
        <View style={styles.emptyState}>
          <Icon name="person-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No user selected</Text>
          <Text style={styles.emptySubtitle}>Return to the user list and pick an account to chat with.</Text>
        </View>
      ) : (
        <>
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            ListFooterComponent={<View style={{ height: 12 }} />}
          />
          <View style={styles.composerRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a private note…"
              value={draft}
              onChangeText={setDraft}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, draft.trim().length === 0 && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={draft.trim().length === 0}
            >
              <Icon name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  adminRow: {
    justifyContent: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  messageBubble: {
    maxWidth: '76%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adminBubble: {
    backgroundColor: '#0B72B9',
    marginRight: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#111827',
  },
  adminText: {
    color: '#FFFFFF',
  },
  messageTimestamp: {
    marginTop: 6,
    fontSize: 11,
    color: '#64748B',
  },
  adminTimestamp: {
    color: '#E0F2FE',
  },
  adminIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#0B72B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: 14,
    color: '#111827',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0B72B9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B7C6DE',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default AdminDirectMessageScreen;
