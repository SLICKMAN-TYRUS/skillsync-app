import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { fetchSavedGigs } from '../services/api';
import GigCard from '../../components/GigCard';
import ErrorBanner from '../../components/ErrorBanner';

export default function SavedGigsScreen({ navigation }) {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
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

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 12 }}>
      {error ? <ErrorBanner message={error} /> : null}
      {saved.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 36 }}>
          <Text style={{ marginBottom: 12 }}>You haven't saved any gigs yet.</Text>
          <TouchableOpacity style={{ backgroundColor: '#2b75f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }} onPress={() => navigation.navigate('GigsScreen')}>
            <Text style={{ color: '#fff' }}>Browse Gigs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const gig = item.gig || item;
            return (
              <TouchableOpacity onPress={() => navigation.navigate('GigDetailScreen', { gigId: gig.id, gig })}>
                <GigCard gig={gig} />
            </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
