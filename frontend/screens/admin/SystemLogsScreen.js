import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { adminApi } from '../../services/api';
import HeaderBack from '../../components/HeaderBack';
import { ensureTestAuth } from '../../services/devAuth';
import { pushToast } from '../../services/toastStore';

const FILTERS = [
  { title: 'All', value: 'all' },
  { title: 'Approvals', value: 'gig_approved' },
  { title: 'Rejections', value: 'gig_rejected' },
  { title: 'Users', value: 'user_status_changed' },
];

const SystemLogsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(
    async ({ silent } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const allowDevBypass =
          (typeof __DEV__ !== 'undefined' && __DEV__) ||
          process?.env?.ALLOW_DEV_TOKENS === 'true';

        if (allowDevBypass) {
          await ensureTestAuth('firebase-uid-admin1', 'admin');
        }

        const params = {
          action: filter === 'all' ? undefined : filter,
          search: searchQuery || undefined,
          per_page: 50,
        };

        const response = await adminApi.getSystemLogs(params);
        const payload = response?.data;
        setLogs(Array.isArray(payload) ? payload : payload?.items || []);
      } catch (error) {
        console.error('Error fetching system logs:', error);
        pushToast({ type: 'error', message: 'Failed to load system logs.' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, searchQuery],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs({ silent: true });
  }, [fetchLogs]);

  const allowedActions = useMemo(
    () => ({
      gig_created: {
        icon: 'add-circle-outline',
        color: '#0B72B9',
        label: 'Gig Created',
      },
      gig_approved: {
        icon: 'check-circle-outline',
        color: '#16A34A',
        label: 'Gig Approved',
      },
      gig_rejected: {
        icon: 'highlight-off',
        color: '#F97316',
        label: 'Gig Rejected',
      },
      user_role_changed: {
        icon: 'swap-horiz',
        color: '#6366F1',
        label: 'Role Updated',
      },
      user_deleted: {
        icon: 'delete-forever',
        color: '#DC2626',
        label: 'User Deleted',
      },
      user_status_changed: {
        icon: 'pause-circle-outline',
        color: '#F59E0B',
        label: 'Status Changed',
      },
      rating_moderated: {
        icon: 'gavel',
        color: '#8B5CF6',
        label: 'Rating Moderated',
      },
    }),
    [],
  );

  const getLogMeta = useCallback(
    (action) => {
      if (!action) {
        return { icon: 'info', color: '#0F172A', label: 'Event' };
      }
      return (
        allowedActions[action] || {
          icon: 'info',
          color: '#0F172A',
          label: action.replace(/_/g, ' '),
        }
      );
    },
    [allowedActions],
  );

  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderLogItem = ({ item }) => {
    const meta = getLogMeta(item.action);
    const actor = item.user?.name
      ? `${item.user.name} (${item.user.role})`
      : 'System';
    const timestamp = item.created_at
      ? new Date(item.created_at).toLocaleString()
      : '—';
    const resourceLabel = item.resource_type
      ? item.resource_type.replace(/_/g, ' ')
      : 'resource';
    const detailEntries = Object.entries(item.details || {});

    return (
      <View style={styles.logItem}>
        <View style={styles.logHeader}>
          <View style={styles.iconWrap}>
            <Icon name={meta.icon} size={20} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logAction}>{meta.label}</Text>
            <Text style={styles.logMeta}>{`#${
              item.resource_id || '—'
            } • ${resourceLabel}`}</Text>
          </View>
          <Text style={styles.logTimestamp}>{timestamp}</Text>
        </View>

        {detailEntries.length ? (
          <View style={styles.detailList}>
            {detailEntries.map(([key, value]) => (
              <View key={key} style={styles.detailRow}>
                <Text style={styles.detailKey}>{key.replace(/_/g, ' ')}</Text>
                <Text style={styles.detailValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.logFooter}>
          <View style={styles.footerItem}>
            <Icon name="person" size={16} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.footerText}>{actor}</Text>
          </View>
          <View style={styles.footerItem}>
            <Icon name="layers" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.footerText}>{item.action || 'event'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBack title="System Logs" backTo="AdminDashboard" />
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={24} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((entry) => (
          <FilterButton key={entry.value} title={entry.title} value={entry.value} />
        ))}
      </View>

      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={48} color="#666666" />
            <Text style={styles.emptyText}>
              {loading ? 'Loading activity…' : 'No matching log entries'}
            </Text>
            <Text style={styles.emptySubtext}>
              Adjust filters or sync again to see recent actions.
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  searchButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#0B72B9',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  filterButton: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#0B72B9',
  },
  filterButtonText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  logMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logTimestamp: {
    color: '#475569',
    fontSize: 12,
    marginLeft: 12,
  },
  detailList: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailKey: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  detailValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#4B5563',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default SystemLogsScreen;
