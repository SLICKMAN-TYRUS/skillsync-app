// screens/ProviderDashboardScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HeaderBack from '../../components/HeaderBack';
import { useNavigation } from '@react-navigation/native';
import { fetchRoutes, providerApi } from '../../services/api';

const sampleGigs = [
  { id: '1', title: 'Graphic Design for Marketing', status: 'Assigned', applicants: 3 },
  { id: '2', title: 'Website Development', status: 'Completed', applicants: 5 },
  { id: '3', title: 'Social Media Strategy', status: 'Available', applicants: 2 },
];

export default function ProviderDashboardScreen() {
  const navigation = useNavigation();
  const [routes, setRoutes] = useState([]);
  const [gigs] = useState(sampleGigs);
  const [openContracts, setOpenContracts] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await fetchRoutes();
        if (!mounted) return;
        if (all && all.Provider) setRoutes(all.Provider);
        // fetch provider dashboard counts from mock API (runs on localhost:4000)
        try {
          const resp = await fetch('http://localhost:4000/api/provider/dashboard');
          const dash = await resp.json();
          if (dash) setOpenContracts(dash.openContracts || 0);
        } catch (err) {
          // ignore if mock API not available
        }
      } catch (e) {
        console.warn('Failed to fetch routes', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const renderStatusBadge = (status) => {
    const color = status === 'Completed' ? '#4CAF50' : status === 'Assigned' ? '#FF9800' : '#2196F3';
    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}> 
        <Text style={styles.statusText}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <HeaderBack title="Provider Dashboard" backTo="Login" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: 'https://placehold.co/64x64/0b72b9/ffffff?text=P' }} style={styles.avatar} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.providerName}>Provider Name</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.smallText}> 4.8 • Kigali</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.headerAction}>
          <Icon name="settings" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EAF6FF' }]}>
            <Icon name="work" size={28} color="#0b72b9" />
            <Text style={styles.statValue}>{gigs.length}</Text>
            <Text style={styles.statLabel}>Active Gigs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF5EB' }]}>
            <Icon name="group" size={28} color="#ff8a00" />
            <Text style={styles.statValue}>10</Text>
            <Text style={styles.statLabel}>Applicants</Text>
          </View>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#FFF7FF' }]} onPress={() => navigation.navigate('ManageGigs')}>
            <Icon name="assignment" size={28} color="#8c4bd6" />
            <Text style={styles.statValue}>{openContracts}</Text>
            <Text style={styles.statLabel}>Open Contracts</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Your Gigs</Text>
        {gigs.map((gig) => (
          <View key={gig.id} style={styles.gigCard}>
            <View style={styles.gigLeft}>
              <View style={styles.gigIconWrap}>
                <Icon name="work-outline" size={28} color="#0b72b9" />
              </View>
            </View>
            <View style={styles.gigBody}>
              <Text style={styles.gigTitle}>{gig.title}</Text>
              <View style={styles.rowBetween}>
                {renderStatusBadge(gig.status)}
                <Text style={styles.smallTextDark}>{gig.applicants} applicants</Text>
              </View>
              <View style={styles.gigActions}>
                <TouchableOpacity style={styles.actionIcon} onPress={() => navigation.navigate('ReviewApplications', { gigId: gig.id })}>
                  <View style={[styles.iconCircle, { backgroundColor: '#EAF4FF' }]}>
                    <Icon name="preview" size={20} color="#0b72b9" />
                  </View>
                  <Text style={styles.iconLabel}>Review</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIcon} onPress={() => navigation.navigate('RateStudents', { gigId: gig.id })}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FFF6E8' }]}>
                    <Icon name="thumb-up" size={20} color="#ff8a00" />
                  </View>
                  <Text style={styles.iconLabel}>Rate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionIcon} onPress={() => navigation.navigate('ChatScreen', { sender: 'Student' })}>
                  <View style={[styles.iconCircle, { backgroundColor: '#EAF9EE' }]}>
                    <Icon name="chat" size={20} color="#1e8e3e" />
                  </View>
                  <Text style={styles.iconLabel}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {routes.length > 0 ? (
            routes.map((r) => (
              <TouchableOpacity key={r.id} style={styles.actionCard} onPress={() => navigation.navigate(r.path.includes('/provider/post') ? 'PostGig' : r.path.includes('/provider/manage') ? 'ManageGigs' : 'ProviderDashboard')}>
                <Icon name="bolt" size={20} color="#fff" />
                <Text style={styles.actionCardText}>{r.title}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PostGig')}>
              <Icon name="add-circle" size={20} color="#fff" />
              <Text style={styles.actionCardText}>Post New Gig</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PostGig')}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    height: 120,
    backgroundColor: '#0b72b9',
    paddingHorizontal: 18,
    paddingTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  providerName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  smallText: { color: '#DFF3FF', fontSize: 12 },
  smallTextDark: { color: '#677287', fontSize: 12 },
  headerAction: { padding: 8 },

  container: { padding: 18, paddingBottom: 120 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  statCard: { flex: 1, marginHorizontal: 6, borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 8, color: '#083b66' },
  statLabel: { fontSize: 12, color: '#556270' },

  sectionTitle: { fontSize: 16, fontWeight: '800', marginVertical: 14, color: '#2b3944' },

  gigCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  gigLeft: { width: 60, alignItems: 'center', justifyContent: 'center' },
  gigIconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EAF6FF', alignItems: 'center', justifyContent: 'center' },
  gigBody: { flex: 1, paddingLeft: 12 },
  gigTitle: { fontSize: 15, fontWeight: '800', color: '#0b72b9' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  gigActions: { flexDirection: 'row', marginTop: 12 },
  actionIcon: { alignItems: 'center', marginRight: 18 },
  iconCircle: { width: 50, height: 50, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8, elevation: 2 },
  iconLabel: { fontSize: 12, color: '#333', fontWeight: '700' },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { backgroundColor: '#0b72b9', padding: 14, borderRadius: 12, marginBottom: 12, width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  actionCardText: { color: '#fff', marginLeft: 8, fontWeight: '800' },

  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: '#0b72b9', width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', elevation: 6 },
});