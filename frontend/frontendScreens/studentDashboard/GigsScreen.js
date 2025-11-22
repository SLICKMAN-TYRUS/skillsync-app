// screens/GigsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { useNavigation } from '@react-navigation/native';
import { fetchGigs } from '../services/api';
import GigCard from '../../components/GigCard';

export default function GigsScreen() {
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchGigs();
        if (!mounted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load gigs', err);
        setError(err?.message || 'Failed to load gigs');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
  <HeaderBack title="Browse Gigs" backTo="StudentDashboard" />
  <ErrorBanner message={error} onClose={() => setError('')} />
  <View style={styles.header}>
          <Text style={styles.headerTitle}>SkillSync</Text>
        </View>

        {/* Gig Listings */}
        {loading && <ActivityIndicator size="large" color="#0077cc" />}
        {!loading && items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No gigs are available yet. Please check back soon.</Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SavedGigsScreen')}>
              <Text style={styles.buttonText}>View Saved Gigs</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && items.map((gig) => (
          <View key={gig.id} style={{ marginBottom: 16 }}>
            <GigCard
              gig={gig}
              onPress={(detail) => {
                try {
                  navigation.navigate('GigDetailScreen', { gig: detail, gigId: detail.id });
                } catch (err) {
                  console.error('Navigation error', err);
                  setError('Unable to open gig details');
                }
              }}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  container: {
    width: '90%',
    maxWidth: 500,
  },
  header: {
    backgroundColor: '#0077cc',
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
    borderRadius: 10,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#f2f8ff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#f2f8ff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
    textAlign: 'center',
  },
});