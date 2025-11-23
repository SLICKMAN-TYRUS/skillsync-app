import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RoleBadge from '../../components/RoleBadge';
import api from '../../services/api';
import { ensureTestAuth } from '../../services/devAuth';

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-admin1', 'admin');
      }
      const response = await api.get('/admin/users', {
        params: { search: searchQuery },
      });
      // backend returns paginated object { items, page, per_page, total }
      setUsers(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = () => {
    fetchUsers();
  };

  // backend does not expose a direct status endpoint; admin can change roles

  const handleRoleChange = async (userId, newRole) => {
    Alert.alert(
      'Change User Role',
      `Are you sure you want to change this user's role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            try {
              if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
                await ensureTestAuth('firebase-uid-admin1', 'admin');
              }
              await api.patch(`/admin/users/${userId}/role`, { role: newRole });
              setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
              ));
              Alert.alert('Success', 'User role updated successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to update user role');
            }
          },
        },
      ],
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <RoleBadge role={item.role} />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: '#E0E0E0' }]}> 
          <Text style={[styles.statusText, { color: '#333333' }]}>{item.role}</Text>
        </View>
      </View>

      <Text style={styles.userEmail}>{item.email}</Text>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Icon name="work" size={16} color="#666666" />
          <Text style={styles.statText}>{item.average_rating ? `${item.average_rating} Rating` : 'No rating'}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="star" size={16} color="#666666" />
          <Text style={styles.statText}>{item.role}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="date-range" size={16} color="#666666" />
          <Text style={styles.statText}>Joined {item.created_at ? item.created_at.split('T')[0] : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRoleChange(item.id, 'student')}
        >
          <Text style={styles.actionButtonText}>Make Student</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRoleChange(item.id, 'provider')}
        >
          <Text style={styles.actionButtonText}>Make Provider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={24} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchUsers} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="people" size={48} color="#666666" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 8,
  },
  searchButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 0.48,
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0066CC',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

export default UserManagementScreen;