import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { providerApi } from '../../services/api';
import firestoreAdapter from '../../services/firestoreAdapter';
import { firebaseAuth } from '../../services/firebaseConfig';
import { ensureTestAuth } from '../../services/devAuth';
import RatingStars from '../../components/RatingStars';
import HeaderBack from '../../components/HeaderBack';

const chartWidth = Math.max(Math.min(Dimensions.get('window').width - 64, 500), 280);

const ProviderDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalGigs: 0,
    activeGigs: 0,
    pendingApproval: 0,
    completedGigs: 0,
    totalApplications: 0,
    averageRating: 0,
    earnings: 0,
  });
  const [earningsData, setEarningsData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [myGigs, setMyGigs] = useState([]);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-provider1', 'provider');
      }

      const response = await providerApi.getGigs();
      const gigsPayload = response?.data || [];
      const gigs = Array.isArray(gigsPayload) ? gigsPayload : gigsPayload.items || [];

      setMyGigs(gigs);

      const activeGigs = gigs.filter((gig) => gig.status === 'open').length;
      const pendingApproval = gigs.filter((gig) => gig.approval_status && gig.approval_status !== 'approved').length;
      const completedGigs = gigs.filter((gig) => gig.status === 'completed').length;
      const totalApplications = gigs.reduce((sum, gig) => {
        if (typeof gig.application_count === 'number') {
          return sum + gig.application_count;
        }
        if (Array.isArray(gig.applications)) {
          return sum + gig.applications.length;
        }
        return sum;
      }, 0);
      const averageRating = gigs.length
        ? gigs.reduce((sum, gig) => sum + (Number(gig.provider_rating) || Number(gig.average_rating) || 0), 0) / gigs.length
        : 0;
      const earnings = gigs.reduce((sum, gig) => sum + (Number(gig.budget) || Number(gig.compensation) || 0), 0);

      setStats({
        totalGigs: gigs.length,
        activeGigs,
        pendingApproval,
        completedGigs,
        totalApplications,
        averageRating,
        earnings,
      });

      const topGigs = gigs.slice(0, 6);
      setEarningsData({
        labels: topGigs.map((gig, index) => gig.title?.slice(0, 10) || `Gig ${index + 1}`),
        datasets: [
          {
            data: topGigs.map((gig) => Number(gig.budget) || Number(gig.compensation) || 0),
          },
        ],
      });
    } catch (error) {
      console.warn('API dashboard fetch failed, falling back to Firestore:', error?.message || error);
      try {
        const uid = (firebaseAuth && firebaseAuth.currentUser && firebaseAuth.currentUser.uid) || null;
        let gigs = [];
        if (uid) {
          gigs = await firestoreAdapter.fetchGigsByProvider(uid);
        } else {
          // last-resort: fetch all gigs and filter by providerName if possible
          gigs = await firestoreAdapter.fetchGigs();
        }

        const normalizedGigs = gigs.map((gig) => ({
          id: gig.id || gig._raw?.id,
          title: gig.title || gig._raw?.title,
          status: gig._raw?.status || gig.status,
          category: gig._raw?.category || gig.category,
          location: gig._raw?.location || gig.location,
          budget: gig.price || gig._raw?.price || 0,
          approval_status: gig._raw?.approval_status || 'approved',
          applicantsCount: gig.applicantsCount || 0,
          rating: gig.rating || 0,
        }));

        setMyGigs(normalizedGigs);

        const activeGigs = normalizedGigs.filter(g => g.status !== 'completed').length;
        const completedGigs = normalizedGigs.filter(g => g.status === 'completed').length;
        const totalApplications = normalizedGigs.reduce((acc, g) => acc + (g.applicantsCount || 0), 0);
        const averageRating = normalizedGigs.length
          ? normalizedGigs.reduce((acc, g) => acc + (g.rating || 0), 0) / normalizedGigs.length
          : 0;
        const earnings = normalizedGigs.reduce((acc, g) => acc + ((g.status === 'completed') ? (g.budget || 0) : 0), 0);

        setStats({
          totalGigs: normalizedGigs.length,
          activeGigs,
          pendingApproval: normalizedGigs.filter(g => g.approval_status !== 'approved').length,
          completedGigs,
          totalApplications,
          averageRating,
          earnings,
        });
        setEarningsData({ labels: [], datasets: [{ data: normalizedGigs.slice(0, 8).map(g => g.budget || 0) }] });
      } catch (e) {
        console.error('Fallback Firestore fetch failed:', e);
      }
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color, prefix = '' }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardIcon}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{prefix}{value}</Text>
      </View>
    </View>
  );

  const QuickAction = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Icon name={icon} size={24} color="#0066CC" />
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchDashboardData} />
      }
    >
      <HeaderBack title="Provider Dashboard" />
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>Your Rating: </Text>
          <RatingStars rating={stats.averageRating} size={20} />
          <Text style={styles.ratingValue}>({stats.averageRating.toFixed(1)})</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Active Gigs"
          value={stats.activeGigs}
          icon="work"
          color="#4CAF50"
        />
        <StatCard
          title="Applications"
          value={stats.totalApplications}
          icon="description"
          color="#2196F3"
        />
        <StatCard
          title="Completed"
          value={stats.completedGigs}
          icon="check-circle"
          color="#9C27B0"
        />
        <StatCard
          title="Earnings"
          value={stats.earnings.toFixed(2)}
          icon="attach-money"
          color="#FF9800"
          prefix="$"
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Earnings Overview</Text>
        <LineChart
          data={earningsData}
          width={chartWidth}
          height={220}
          chartConfig={{
            backgroundColor: '#FFFFFF',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#FFFFFF',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {myGigs.length > 0 && (
        <View style={styles.gigListSection}>
          <Text style={styles.sectionTitle}>Your Latest Gigs</Text>
          {myGigs.slice(0, 3).map((gig, index) => (
            <View key={`${gig.id || gig.title || index}`} style={styles.gigListItem}>
              <View style={styles.gigListItemHeader}>
                <Icon name="work-outline" size={20} color="#0066CC" />
                <Text style={styles.gigListItemTitle}>{gig.title || 'Untitled gig'}</Text>
              </View>
              <Text style={styles.gigListItemMeta}>
                {(gig.location && gig.location) || 'Location TBD'} · {(gig.category && gig.category) || 'General'}
              </Text>
              <Text style={styles.gigListItemMeta}>
                Budget: {(gig.currency || 'FRW')} {Number(gig.budget || gig.compensation || 0).toLocaleString()}
              </Text>
              {gig.deadline ? (
                <Text style={styles.gigListItemMeta}>Deadline: {gig.deadline}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Post New Gig"
            icon="add-circle"
            onPress={() => navigation.navigate('PostGig')}
          />
          <QuickAction
            title="View Applications"
            icon="people"
            onPress={() => navigation.navigate('Applications')}
          />
          <QuickAction
            title="Check Ratings"
            icon="star"
            onPress={() => navigation.navigate('Ratings')}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    color: '#666666',
    marginRight: 8,
  },
  ratingValue: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  gigListSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gigListItem: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F9FBFD',
  },
  gigListItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gigListItemTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#102A43',
  },
  gigListItemMeta: {
    fontSize: 13,
    color: '#5C6C80',
    marginBottom: 4,
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '31%',
  },
  quickActionText: {
    color: '#0066CC',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ProviderDashboard;
