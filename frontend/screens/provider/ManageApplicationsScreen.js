import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { api } from '../../services/api';
import firestoreAdapter from '../../services/firestoreAdapter';
import { firebaseAuth } from '../../services/firebaseConfig';

const ManageApplicationsScreen = () => {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, accepted, rejected
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/provider/applications', {
        params: { status: filter },
      });
      setApplications(response.data);
    } catch (error) {
      console.warn('API applications fetch failed, falling back to Firestore:', error?.message || error);
      try {
        const uid = (firebaseAuth && firebaseAuth.currentUser && firebaseAuth.currentUser.uid) || null;
        let apps = [];
        if (uid) {
          apps = await firestoreAdapter.fetchApplicationsByProvider(uid, filter === 'pending' ? 'pending' : null);
        }
        setApplications(apps);
      } catch (e) {
        console.error('Fallback Firestore fetch failed:', e);
      } finally {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.patch(`/provider/applications/${applicationId}`, {
        status: newStatus,
      });
      setApplications(applications.filter(app => app.id !== applicationId));
      Alert.alert('Success', `Application ${newStatus} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update application status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'accepted':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderApplicationItem = ({ item }) => (
    <View style={styles.applicationCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.gigTitle}>{item.gigTitle}</Text>
          <Text style={styles.applicantName}>{item.studentName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.message} numberOfLines={3}>
        {item.message}
      </Text>

      <View style={styles.details}>
        <Text style={styles.detailText}>
          <Icon name="event" size={16} color="#666666" /> Applied: {item.appliedDate}
        </Text>
        <Text style={styles.detailText}>
          <Icon name="school" size={16} color="#666666" /> Year: {item.studentYear}
        </Text>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleStatusChange(item.id, 'accepted')}
          >
            <Icon name="check" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleStatusChange(item.id, 'rejected')}
          >
            <Icon name="close" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterButton title="Pending" value="pending" />
        <FilterButton title="Accepted" value="accepted" />
        <FilterButton title="Rejected" value="rejected" />
      </View>

      <FlatList
        data={applications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchApplications} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={48} color="#666666" />
            <Text style={styles.emptyText}>
              No {filter} applications found
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
    backgroundColor: '#F5F5F5',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  filterButtonText: {
    color: '#666666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#0066CC',
  },
  listContainer: {
    padding: 16,
  },
  applicationCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  applicantName: {
    fontSize: 14,
    color: '#666666',
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
    textTransform: 'capitalize',
  },
  message: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
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

export default ManageApplicationsScreen;
