import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import RatingStars from '../../components/RatingStars';
import { api } from '../../services/api';
import { firebaseAuth } from '../../services/firebaseConfig';
import HeaderBack from '../../components/HeaderBack';

const RatingScreen = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const fetchRatings = async () => {
    try {
      const uid = firebaseAuth?.currentUser?.uid;
      if (!uid) {
        console.warn('No authenticated user');
        return;
      }
      // Get user profile first to get the user ID
      const profileResponse = await api.get('/users/profile');
      const userId = profileResponse.data.id;
      
      const response = await api.get(`/ratings/user/${userId}`);
      setRatings(response.data || []);
      calculateAverageRating(response.data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateAverageRating = (ratingsList) => {
    if (ratingsList.length === 0) return;
    const sum = ratingsList.reduce((acc, curr) => acc + (curr.score || curr.rating || 0), 0);
    setAverageRating((sum / ratingsList.length).toFixed(1));
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRatings();
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const renderRatingItem = ({ item }) => (
    <View style={styles.ratingItem}>
      <View style={styles.ratingHeader}>
        <Text style={styles.studentName}>{item.studentName}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <RatingStars rating={item.rating} size={20} />
      <Text style={styles.comment}>{item.comment}</Text>
      <Text style={styles.gigTitle}>Gig: {item.gigTitle}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBack title="Ratings" backTo="ProviderDashboard" />
      <View style={styles.header}>
        <Text style={styles.title}>My Ratings</Text>
        <View style={styles.averageRating}>
          <Text style={styles.averageText}>Average Rating:</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.averageNumber}>{averageRating}</Text>
            <RatingStars rating={Number(averageRating)} size={24} />
          </View>
        </View>
      </View>

      <FlatList
        data={ratings}
        renderItem={renderRatingItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No ratings yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  averageRating: {
    marginTop: 8,
  },
  averageText: {
    fontSize: 16,
    color: '#666666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  averageNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  ratingItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    color: '#666666',
  },
  comment: {
    marginTop: 8,
    color: '#333333',
    lineHeight: 20,
  },
  gigTitle: {
    marginTop: 8,
    color: '#666666',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default RatingScreen;
