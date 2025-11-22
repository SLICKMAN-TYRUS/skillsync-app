import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import devAuth, { enableTestAuth, disableTestAuth } from '../services/devAuth';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import notificationService, { startPolling, stopPolling, subscribe, unsubscribe } from '../services/notifications';
import NotificationsModal from './NotificationsModal';

const Navbar = ({ title, showBack = false, rightAction = null }) => {
  const navigation = useNavigation();
  const [devEnabled, setDevEnabled] = useState(false);
  const [savedCount, setSavedCount] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const devAllowed = (typeof __DEV__ !== 'undefined' && __DEV__) || (typeof process !== 'undefined' && process.env && process.env.ALLOW_DEV_TOKENS === 'true');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setDevEnabled(window.localStorage.getItem('use_test_tokens') === 'true');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await api.get('/users/saved-gigs');
        const payload = resp.data;
        const items = Array.isArray(payload) ? payload : (payload.items || []);
        if (mounted) setSavedCount(items.length || 0);
      } catch (e) {
        // ignore silently — badge is optional
      }
    };
    load();
    const unsub = navigation.addListener && navigation.addListener('focus', load);

    // start notifications polling and subscribe
    const cb = (payload) => {
      if (!mounted) return;
      setUnreadCount(payload?.unreadCount || 0);
    };
    subscribe(cb);
    startPolling();

    return () => {
      mounted = false;
      unsubscribe(cb);
      stopPolling();
      if (unsub && typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  const toggleDev = async () => {
    if (!devEnabled) {
      await enableTestAuth('firebase-uid-admin1', 'admin');
      setDevEnabled(true);
    } else {
      await disableTestAuth();
      setDevEnabled(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
        )}
        
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        
        {rightAction && (
          <TouchableOpacity
            style={styles.rightButton}
            onPress={rightAction.onPress}
          >
            {rightAction.icon ? (
              <Icon name={rightAction.icon} size={24} color="#333333" />
            ) : (
              <Text style={styles.rightButtonText}>{rightAction.title}</Text>
            )}
          </TouchableOpacity>
        )}
        {devAllowed && (
          <TouchableOpacity onPress={toggleDev} style={[styles.devBadge, devEnabled ? styles.devOn : styles.devOff]} accessibilityLabel="Toggle dev test tokens">
            <Text style={styles.devText}>{devEnabled ? 'DEV ON' : 'DEV'}</Text>
          </TouchableOpacity>
        )}
        {savedCount !== null && (
          <TouchableOpacity onPress={() => navigation.navigate('SavedGigsScreen')} style={styles.savedBadge} accessibilityLabel="Saved gigs">
            <Text style={styles.savedText}>{savedCount}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setNotifOpen(true)} style={styles.notifBadge} accessibilityLabel="Notifications">
          <Icon name="notifications" size={22} color="#333333" />
          {unreadCount > 0 && (
            <View style={styles.notifCount}>
              <Text style={styles.notifCountText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <NotificationsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  rightButton: {
    padding: 8,
  },
  rightButtonText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
  },
  devBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devOn: {
    backgroundColor: '#D32F2F',
  },
  devOff: {
    backgroundColor: '#F0F0F0',
  },
  devText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  savedBadge: {
    marginLeft: 8,
    backgroundColor: '#D32F2F',
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  savedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  notifBadge: {
    marginLeft: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifCount: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: '#D32F2F',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifCountText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

export default Navbar;
