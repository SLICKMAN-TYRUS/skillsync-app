import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import notificationService from '../../services/notifications';
import { ensureTestAuth } from '../../services/devAuth';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const getVisuals = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'application':
      case 'application_received':
        return { icon: 'briefcase-outline', iconColor: '#1D4ED8', iconBg: '#E0EAFF' };
      case 'status_change':
      case 'application_status':
        return { icon: 'checkmark-done-outline', iconColor: '#15803D', iconBg: '#DCFCE7' };
      case 'system':
        return { icon: 'information-circle-outline', iconColor: '#7C3AED', iconBg: '#EDE9FE' };
      case 'message':
      case 'chat':
        return { icon: 'chatbubble-ellipses-outline', iconColor: '#DB2777', iconBg: '#FFE4E6' };
      default:
        return { icon: 'notifications-outline', iconColor: '#0F172A', iconBg: '#F1F5F9' };
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadNotifications = useCallback(async ({ silent } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }
      const recent = await notificationService.getRecent(6);
      setNotifications(Array.isArray(recent) ? recent.slice(0, 4) : []);
      setError('');
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError('Unable to load notifications right now.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications({ silent: true });
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      await loadNotifications({ silent: true });
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
      setError('Unable to mark notifications right now.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAll} style={styles.headerAction}>
          <Text style={styles.headerActionText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563EB" />}
      >
        <HeaderBack title="Notifications" backTo="StudentDashboard" />
        <ErrorBanner message={error} onClose={() => setError('')} />

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Stay in sync with providers</Text>
          <Text style={styles.heroSubtitle}>
            Interview invites, application updates, and system reminders show up here first.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={styles.loadingText}>Fetching your latest notifications…</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Nothing to review</Text>
            <Text style={styles.emptySubtitle}>
              You’re all caught up. New updates will appear here as soon as providers take action.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const visuals = getVisuals(notification.category || notification.type);
            return (
              <TouchableOpacity key={notification.id} style={styles.notificationCard} activeOpacity={0.8}>
                <View style={[styles.iconContainer, { backgroundColor: visuals.iconBg }]}>
                  <Ionicons name={visuals.icon} size={22} color={visuals.iconColor} />
                </View>

                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title || 'Notification'}</Text>
                  {notification.message ? (
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                  ) : null}
                  <Text style={styles.notificationMeta}>{formatTime(notification.created_at)}</Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#CBD5F5" />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bottom navigation intentionally removed for cleaner student notifications */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerActionText: {
    color: '#E0ECFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 8,
    backgroundColor: '#F3F4FF',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 18,
    shadowColor: '#1E293B',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    lineHeight: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  notificationMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#2196F3',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 18,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default NotificationsScreen;
