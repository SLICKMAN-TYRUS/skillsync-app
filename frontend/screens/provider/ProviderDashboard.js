import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { api } from '../../services/api';
import RatingStars from '../../components/RatingStars';

const ProviderDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    activeGigs: 0,
    totalApplications: 0,
    completedGigs: 0,
    averageRating: 0,
    earnings: 0,
  });
  const [earningsData, setEarningsData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/provider/dashboard');
      setStats(response.data.stats);
      setEarningsData(response.data.earningsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
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
          width={styles.chartWidth}
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

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Post New Gig"
            icon="add-circle"
            onPress={() => navigation.navigate('Post Gig')}
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
  chartWidth: {
    width: '100%' - 32,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
