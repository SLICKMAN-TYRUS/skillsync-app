import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RoleBadge from '../../components/RoleBadge';
import HeaderBack from '../../components/HeaderBack';
import { adminApi } from '../../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import { pushToast } from '../../services/toastStore';

const roleOrder = ['admin', 'provider', 'student'];
const roleLabels = {
  admin: 'Administrators',
  provider: 'Providers',
  student: 'Students',
};

const statusColors = {
  available: '#4CAF50',
  active: '#4CAF50',
  suspended: '#F97316',
};

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = useCallback(
    async ({ silent } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
          await ensureTestAuth('firebase-uid-admin1', 'admin');
        }
        const response = await adminApi.getUsers({ search: searchQuery || undefined });
        const payload = response?.data;
        const items = Array.isArray(payload) ? payload : payload?.items;
        setUsers(items || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        pushToast({ type: 'error', message: 'Failed to load users.' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    fetchUsers();
  };

  const filteredUsers = useMemo(() => {
    const normalizedRole = roleFilter.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    return users
      .filter((user) =>
        normalizedRole === 'all' ? true : (user.role || '').toLowerCase() === normalizedRole,
      )
      .filter((user) => {
        if (!query) {
          return true;
        }
        const haystack = `${user.name || ''} ${user.email || ''} ${(user.role || '')}`.toLowerCase();
        return haystack.includes(query);
      });
  }, [users, roleFilter, searchQuery]);

  const sections = useMemo(() => {
    const grouped = roleOrder.reduce((acc, role) => ({ ...acc, [role]: [] }), {});
    filteredUsers.forEach((user) => {
      const role = (user.role || '').toLowerCase();
      if (grouped[role]) {
        grouped[role].push(user);
      }
    });
    return roleOrder
      .map((role) => ({
        role,
        title: roleLabels[role],
        data: grouped[role],
      }))
      .filter((section) => section.data.length > 0);
  }, [filteredUsers]);

  const setUserById = useCallback((userId, updater) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? updater(user) : user)));
  }, []);

  const removeUserById = useCallback((userId) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId));
  }, []);

  const handleToggleSuspend = useCallback(
    async (user) => {
      const currentStatus = (user.availability_status || 'available').toLowerCase();
      const targetStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      try {
        await adminApi.updateUserStatus(user.id, { status: targetStatus });
        const nextStatus = targetStatus === 'suspended' ? 'suspended' : 'available';
        setUserById(user.id, (existing) => ({ ...existing, availability_status: nextStatus }));
        pushToast({
          type: 'success',
          message: `User ${targetStatus === 'suspended' ? 'suspended' : 'reinstated'}.`,
        });
      } catch (error) {
        console.error('Failed to update user status', error);
        pushToast({ type: 'error', message: 'Could not update user status.' });
      }
    },
    [setUserById],
  );

  const confirmDelete = useCallback(
    (user) => {
      const proceed = async () => {
        try {
          await adminApi.deleteUser(user.id);
          removeUserById(user.id);
          pushToast({ type: 'success', message: 'User deleted.' });
        } catch (error) {
          console.error('Failed to delete user', error);
          pushToast({ type: 'error', message: 'Could not delete user.' });
        }
      };

      if (Platform.OS === 'web') {
        const confirmed = typeof window !== 'undefined' ? window.confirm(`Delete ${user.name}? This cannot be undone.`) : false;
        if (confirmed) {
          proceed();
        }
        return;
      }

      Alert.alert(
        'Delete user',
        `Are you sure you want to permanently delete ${user.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: proceed },
        ],
      );
    },
    [removeUserById],
  );

  const handleNavigateToChat = useCallback(
    (user) => {
      navigation.navigate('AdminDirectMessage', { user });
    },
    [navigation],
  );

  const handleRoleChange = useCallback(
    (user, newRole) => {
      Alert.alert(
        'Change user role',
        `Assign ${user.name} the ${newRole} role?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change',
            onPress: async () => {
              try {
                await adminApi.updateUserRole(user.id, { role: newRole });
                setUserById(user.id, (existing) => ({ ...existing, role: newRole }));
                pushToast({ type: 'success', message: 'User role updated.' });
              } catch (error) {
                console.error('Failed to update role', error);
                pushToast({ type: 'error', message: 'Could not update role.' });
              }
            },
          },
        ],
      );
    },
    [setUserById],
  );

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
      </View>
    </View>
  );

  const renderUserItem = ({ item }) => {
    const initials = (item.name || '?')
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const status = (item.availability_status || 'available').toLowerCase();
    const statusColor = statusColors[status] || '#6B7280';
    const suspended = status === 'suspended';

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.identityRow}>
            <View style={[styles.avatar, { backgroundColor: `${statusColor}33` }]}>
              <Text style={[styles.avatarText, { color: statusColor }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { borderColor: statusColor }]}>
            <Icon name={suspended ? 'pause-circle-filled' : 'check-circle'} size={16} color={statusColor} style={{ marginRight: 6 }} />
            <Text style={[styles.statusText, { color: statusColor }]}>{suspended ? 'Suspended' : 'Active'}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="event" size={16} color="#4B5B76" style={styles.metaIcon} />
            <Text style={styles.metaLabel}>Joined</Text>
            <Text style={styles.metaValue}>{item.created_at ? item.created_at.split('T')[0] : '—'}</Text>
          </View>
          {item.role === 'provider' ? (
            <View style={styles.metaItem}>
              <Icon name="work" size={16} color="#4B5B76" style={styles.metaIcon} />
              <Text style={styles.metaLabel}>Gigs</Text>
              <Text style={styles.metaValue}>{item.gig_count ?? 0}</Text>
            </View>
          ) : null}
          {item.role === 'student' ? (
            <View style={styles.metaItem}>
              <Icon name="assignment" size={16} color="#4B5B76" style={styles.metaIcon} />
              <Text style={styles.metaLabel}>Applications</Text>
              <Text style={styles.metaValue}>{item.application_count ?? 0}</Text>
            </View>
          ) : null}
          <View style={[styles.metaItem, { flexGrow: 1 }]}>
            <Icon name="star" size={16} color="#FBBF24" style={styles.metaIcon} />
            <Text style={styles.metaLabel}>Rating</Text>
            <Text style={styles.metaValue}>{Number(item.average_rating || 0).toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.roleRow}>
          <RoleBadge role={item.role} />
          <View style={styles.roleChangeRow}>
            {roleOrder
              .filter((role) => role !== (item.role || '').toLowerCase())
              .map((role) => (
                <TouchableOpacity key={role} style={styles.roleChangeChip} onPress={() => handleRoleChange(item, role)}>
                  <Text style={styles.roleChangeText}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionChip, styles.chatChip]} onPress={() => handleNavigateToChat(item)}>
            <Icon name="chat" size={18} color="#0B72B9" style={{ marginRight: 8 }} />
            <Text style={styles.actionChipText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, suspended ? styles.activateChip : styles.suspendChip]}
            onPress={() => handleToggleSuspend(item)}
          >
            <Icon name={suspended ? 'play-circle-outline' : 'pause-circle-outline'} size={18} color={suspended ? '#16A34A' : '#F97316'} style={{ marginRight: 8 }} />
            <Text style={[styles.actionChipText, { color: suspended ? '#16A34A' : '#F97316' }]}>
              {suspended ? 'Reinstate' : 'Suspend'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionChip, styles.deleteChip]} onPress={() => confirmDelete(item)}>
            <Icon name="delete" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={[styles.actionChipText, { color: '#DC2626' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBack title="User Management" backTo="AdminDashboard" />
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#4B5B76" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or role"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>Sync</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.roleFilterRow}>
        {['all', ...roleOrder].map((role) => {
          const isActive = roleFilter === role;
          return (
            <TouchableOpacity
              key={role}
              style={[styles.roleFilterChip, isActive && styles.roleFilterChipActive]}
              onPress={() => setRoleFilter(role)}
            >
              <Text style={[styles.roleFilterText, isActive && styles.roleFilterTextActive]}>
                {role === 'all' ? 'All users' : roleLabels[role]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchUsers({ silent: true });
            }}
            tintColor="#0B72B9"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{loading ? 'Loading users…' : 'No users match the current filters'}</Text>
            <Text style={styles.emptySubtitle}>Adjust your filters or sync again to refresh the list.</Text>
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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EDFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1F2937',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B72B9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  roleFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  roleFilterChip: {
    marginRight: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  roleFilterChipActive: {
    backgroundColor: '#0B72B9',
  },
  roleFilterText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  roleFilterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionBadge: {
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E5EDFF',
    alignItems: 'center',
  },
  sectionBadgeText: {
    color: '#0B72B9',
    fontWeight: '700',
    fontSize: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 12,
    color: '#4B5B76',
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
    marginBottom: 10,
  },
  metaIcon: {
    marginRight: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  roleRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleChangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  roleChangeChip: {
    marginLeft: 8,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F2FF',
  },
  roleChangeText: {
    color: '#0B72B9',
    fontWeight: '600',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
    marginBottom: 12,
  },
  actionChipText: {
    fontWeight: '700',
    fontSize: 13,
  },
  chatChip: {
    backgroundColor: '#EFF6FF',
  },
  activateChip: {
    backgroundColor: '#ECFDF5',
  },
  suspendChip: {
    backgroundColor: '#FFF7ED',
  },
  deleteChip: {
    backgroundColor: '#FEF2F2',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default UserManagementScreen;
