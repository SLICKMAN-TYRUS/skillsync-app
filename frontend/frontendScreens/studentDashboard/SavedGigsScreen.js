import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchSavedGigs } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import GigCard from '../../components/GigCard';
import ErrorBanner from '../../components/ErrorBanner';

export default function SavedGigsScreen({ navigation }) {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }
      const data = await fetchSavedGigs();
      setSaved(data.items || data);
    } catch (err) {
      setError(err.message || JSON.stringify(err));
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        setLoading(true);
        await load();
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => (mounted = false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#2563EB" style={styles.loadingIndicator} />;
  }

  return (
    <View style={styles.screen}>
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        data={saved}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        ListHeaderComponent={
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Saved Gigs</Text>
            <Text style={styles.heroSubtitle}>
              Curate a shortlist so you can tailor applications quickly when new deadlines approach.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No saved gigs yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon on any gig to keep it handy for future applications.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('GigsScreen')}>
              <Text style={styles.emptyButtonText}>Browse gigs</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const gig = item.gig || item;
          return (
            <TouchableOpacity
              style={styles.cardWrapper}
              onPress={() => navigation.navigate('GigDetailScreen', { gigId: gig.id, gig })}
              activeOpacity={0.88}
            >
              <GigCard gig={gig} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4FF',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  loadingIndicator: {
    flex: 1,
    marginTop: 48,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#1E293B',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
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
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
