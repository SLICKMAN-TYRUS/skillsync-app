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

const ApproveGigsScreen = () => {
  const [gigs, setGigs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingGigs = async () => {
    try {
      const response = await api.get('/admin/pending-gigs');
      setGigs(response.data);
    } catch (error) {
      console.error('Error fetching pending gigs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingGigs();
  }, []);

  const handleApprove = async (gigId) => {
    try {
      await api.post(`/admin/gigs/${gigId}/approve`);
      setGigs(gigs.filter(gig => gig.id !== gigId));
      Alert.alert('Success', 'Gig has been approved');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve gig');
    }
  };

  const handleReject = async (gigId) => {
    Alert.alert(
      'Reject Gig',
      'Are you sure you want to reject this gig?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/admin/gigs/${gigId}/reject`);
              setGigs(gigs.filter(gig => gig.id !== gigId));
              Alert.alert('Success', 'Gig has been rejected');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject gig');
            }
          },
        },
      ],
    );
  };

  const renderGigItem = ({ item }) => (
    <View style={styles.gigCard}>
      <View style={styles.gigHeader}>
        <Text style={styles.gigTitle}>{item.title}</Text>
        <Text style={styles.gigPrice}>${item.price}</Text>
      </View>

      <Text style={styles.gigDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.providerInfo}>
        <Icon name="person" size={16} color="#666666" />
        <Text style={styles.providerName}>{item.providerName}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>
          <Icon name="schedule" size={16} color="#666666" /> {item.duration}
        </Text>
        <Text style={styles.detailText}>
          <Icon name="category" size={16} color="#666666" /> {item.category}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleApprove(item.id)}
        >
          <Icon name="check" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
        >
          <Icon name="close" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={gigs}
        renderItem={renderGigItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPendingGigs} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={48} color="#4CAF50" />
            <Text style={styles.emptyText}>No pending gigs to approve</Text>
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
  listContainer: {
    padding: 16,
  },
  gigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  gigPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
  },
  gigDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333333',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

export default ApproveGigsScreen;
