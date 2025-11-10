import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RatingStars from '../../components/RatingStars';
import RoleBadge from '../../components/RoleBadge';
import { api } from '../../services/api';

const GigDetailScreen = ({ route, navigation }) => {
  const { gigId } = route.params;
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicationMessage, setApplicationMessage] = useState('');

  useEffect(() => {
    fetchGigDetails();
  }, [gigId]);

  const fetchGigDetails = async () => {
    try {
      const response = await api.get(`/student/gigs/${gigId}`);
      setGig(response.data);
    } catch (error) {
      console.error('Error fetching gig details:', error);
      Alert.alert('Error', 'Failed to load gig details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!applicationMessage.trim()) {
      Alert.alert('Error', 'Please write a message to the provider');
      return;
    }

    try {
      await api.post(`/student/gigs/${gigId}/apply`, {
        message: applicationMessage,
      });
      Alert.alert(
        'Success',
        'Your application has been submitted',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Applications'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application');
    }
  };

  if (loading || !gig) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{gig.title}</Text>
          <RoleBadge role={gig.category} />
        </View>
        
        <View style={styles.providerInfo}>
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>{gig.providerName}</Text>
            <View style={styles.rating}>
              <RatingStars rating={gig.rating} size={16} />
              <Text style={styles.ratingCount}>({gig.ratingCount})</Text>
            </View>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Icon name="attach-money" size={20} color="#666666" />
            <Text style={styles.statText}>${gig.price}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="schedule" size={20} color="#666666" />
            <Text style={styles.statText}>{gig.duration}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="people" size={20} color="#666666" />
            <Text style={styles.statText}>{gig.applicantsCount} applied</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{gig.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Requirements</Text>
        <Text style={styles.description}>{gig.requirements}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills Required</Text>
        <View style={styles.skillsContainer}>
          {gig.skillsRequired.map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.applicationSection}>
        <Text style={styles.sectionTitle}>Apply for this Gig</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Write a message to the provider..."
          multiline
          numberOfLines={4}
          value={applicationMessage}
          onChangeText={setApplicationMessage}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
        >
          <Icon name="send" size={24} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>Submit Application</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingCount: {
    marginLeft: 4,
    color: '#666666',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#333333',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '500',
  },
  applicationSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  messageInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 16,
    marginBottom: 16,
  },
  applyButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default GigDetailScreen;
