import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { api } from '../../services/api';

const ApplicationStatusScreen = () => {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('pending'); // pending, accepted, rejected
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/student/applications', {
        params: { status: filter },
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

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
        <View style={styles.titleContainer}>
          <Text style={styles.gigTitle}>{item.gigTitle}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.providerName}>Provider: {item.providerName}</Text>
      </View>

      <Text style={styles.message} numberOfLines={3}>
        Your message: {item.message}
      </Text>

      {item.providerResponse && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Provider Response:</Text>
          <Text style={styles.responseText}>{item.providerResponse}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.date}>
          <Icon name="schedule" size={16} color="#666666" />
          {' '}Applied: {item.appliedDate}
        </Text>
        <View style={styles.gigDetails}>
          <Text style={styles.price}>
            <Icon name="attach-money" size={16} color="#666666" />
            {item.price}
          </Text>
          <Text style={styles.duration}>
            <Icon name="timer" size={16} color="#666666" />
            {item.duration}
          </Text>
        </View>
      </View>
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
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
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
  providerName: {
    fontSize: 14,
    color: '#666666',
  },
  message: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
  },
  responseContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#666666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  date: {
    fontSize: 14,
    color: '#666666',
  },
  gigDetails: {
    flexDirection: 'row',
  },
  price: {
    fontSize: 14,
    color: '#666666',
    marginRight: 16,
  },
  duration: {
    fontSize: 14,
    color: '#666666',
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

export default ApplicationStatusScreen;
