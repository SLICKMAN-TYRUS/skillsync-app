import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GigCard from '../../components/GigCard';
import { api } from '../../services/api';
import { fetchGigs } from '../../services/firestoreAdapter';

const HomeScreen = ({ navigation }) => {
  const [gigs, setGigs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'tutor', label: 'Tutoring', icon: 'school' },
    { id: 'mentor', label: 'Mentoring', icon: 'person' },
    { id: 'assistant', label: 'Research', icon: 'search' },
  ];

  const fetchGigs = async () => {
    try {
      // Prefer Firestore adapter for demo data when available
      const data = await fetchGigs({ category: selectedCategory, search: searchQuery });
      setGigs(data);
    } catch (error) {
      console.error('Error fetching gigs from Firestore adapter:', error);
      // fallback to REST API
      try {
        const response = await api.get('/student/gigs', {
          params: {
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            search: searchQuery,
          },
        });
        setGigs(response.data);
      } catch (err) {
        console.error('Error fetching gigs via API fallback:', err);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [selectedCategory]);

  const handleSearch = () => {
    fetchGigs();
  };

  const handleGigPress = (gig) => {
    navigation.navigate('GigDetail', { gigId: gig.id });
  };

  const CategoryButton = ({ category }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Icon
        name={category.icon}
        size={24}
        color={selectedCategory === category.id ? '#0066CC' : '#666666'}
      />
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category.id && styles.categoryButtonTextActive,
        ]}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={24} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search gigs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {/* Implement filters */}}
          >
            <Icon name="tune" size={24} color="#0066CC" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={categories}
          renderItem={({ item }) => <CategoryButton category={item} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      <FlatList
        data={gigs}
        renderItem={({ item }) => (
          <GigCard gig={item} onPress={handleGigPress} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.gigsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchGigs} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="search-off" size={48} color="#666666" />
            <Text style={styles.emptyText}>No gigs found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesList: {
    paddingHorizontal: 8,
  },
  categoriesContent: {
    paddingHorizontal: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  categoryButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  categoryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#0066CC',
  },
  gigsList: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
});

export default HomeScreen;
