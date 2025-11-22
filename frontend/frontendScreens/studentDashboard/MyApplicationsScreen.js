import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { studentApi } from '../services/api';
import ErrorBanner from '../../components/ErrorBanner';
import GigCard from '../../components/GigCard';

export default function MyApplicationsScreen({ navigation }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);

  const load = async () => {
    try {
      const data = await studentApi.getMyApplications();
      setApps(data.items || data);
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

  const sortedApps = apps.slice().sort((a, b) => {
    const ta = a.created_at || a.applied_at || a.timestamp || a.createdAt || '';
    const tb = b.created_at || b.applied_at || b.timestamp || b.createdAt || '';
    if (!ta && !tb) return 0;
    if (!ta) return 1;
    if (!tb) return -1;
    return sortNewest ? (new Date(tb) - new Date(ta)) : (new Date(ta) - new Date(tb));
  });

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, padding: 12 }}>
      {error ? <ErrorBanner message={error} /> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>My Applications</Text>
        <TouchableOpacity onPress={() => setSortNewest(!sortNewest)} style={{ padding: 6 }}>
          <Text style={{ color: '#2b75f6' }}>{sortNewest ? 'Newest' : 'Oldest'}</Text>
        </TouchableOpacity>
      </View>

      {sortedApps.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 36 }}>
          <Text style={{ marginBottom: 12 }}>You have not applied to any gigs yet.</Text>
          <TouchableOpacity style={{ backgroundColor: '#2b75f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }} onPress={() => navigation.navigate('GigsScreen')}>
            <Text style={{ color: '#fff' }}>Browse Gigs</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedApps}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const gig = item.gig || item.gig_details || null;
            return (
              <TouchableOpacity onPress={() => navigation.navigate('GigDetailScreen', { gigId: gig?.id || item.gig_id, gig })}>
                {gig ? <GigCard gig={gig} /> : <Text style={{ fontWeight: '600' }}>Gig #{item.gig_id}</Text>}
                <Text style={{ marginTop: 6 }}>
                  Status: {item.status} • {item.created_at || item.applied_at || item.timestamp || item.createdAt ? new Date(item.created_at || item.applied_at || item.timestamp || item.createdAt).toLocaleString() : ''}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
