import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';
import HeaderBack from '../../components/HeaderBack';
import { LineChart } from 'react-native-chart-kit';
import { ensureTestAuth } from '../../services/devAuth';

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeGigs: 0,
    pendingApprovals: 0,
    completedGigs: 0,
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState([]);

  const fetchDashboardData = async () => {
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-admin1', 'admin');
      }
      // Get overview analytics and user analytics (for chart)
      const [overviewRes, usersRes] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/admin/analytics/users'),
      ]);

      const overview = overviewRes.data || {};
      setStats({
        totalUsers: (overview.total_students || 0) + (overview.total_providers || 0) + (overview.total_admins || 0),
        activeGigs: overview.active_gigs_count || 0,
        pendingApprovals: overview.total_applications || 0,
        completedGigs: overview.completed_gigs_count || 0,
      });

      // Build a simple chart from user growth if available
      const userAnalytics = usersRes.data || {};
      const labels = (userAnalytics.user_growth || []).map(u => u.month);
      const data = (userAnalytics.user_growth || []).map(u => u.count);
      setChartData({ labels, datasets: [{ data }] });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardIcon}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <HeaderBack title="Admin Dashboard" backTo="Login" />
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="people"
          color="#2196F3"
          onPress={() => navigation.navigate('UserManagement')}
        />
        <StatCard
          title="Active Gigs"
          value={stats.activeGigs}
          icon="work"
          color="#4CAF50"
          onPress={() => navigation.navigate('ApproveGigs')}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon="pending"
          color="#FF9800"
          onPress={() => navigation.navigate('ApproveGigs')}
        />
        <StatCard
          title="Completed Gigs"
          value={stats.completedGigs}
          icon="check-circle"
          color="#9C27B0"
          onPress={() => navigation.navigate('ApproveGigs')}
        />
      </View>

      <TouchableOpacity style={styles.chartContainer} onPress={() => navigation.navigate('SystemLogs')} activeOpacity={0.9}>
        <Text style={styles.chartTitle}>Activity Overview</Text>
        {chartData.labels.length > 0 ? (
          <LineChart
            data={{ labels: chartData.labels, datasets: chartData.datasets }}
            width={Math.max(320, Dimensions.get('window').width - 48)}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 119, 204, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#0077cc' },
            }}
            style={{ borderRadius: 8 }}
          />
        ) : (
          <View style={[styles.chart, { padding: 20, alignItems: 'center' }]}> 
            <Text>No chart data yet.</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {routes.length > 0 ? (
          routes.map((r) => {
            // map known admin route paths to navigator screen names
            const target = r.path && r.path.includes('approve') ? 'ApproveGigs'
                          : r.path && r.path.includes('users') ? 'UserManagement'
                          : r.path && r.path.includes('logs') ? 'SystemLogs'
                          : 'AdminDashboard';

            return (
              <TouchableOpacity
                key={r.id}
                style={styles.actionButton}
                onPress={() => navigation.navigate(target)}
              >
                <Icon name="verified-user" size={24} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>{r.title}</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ApproveGigs')}
            >
              <Icon name="verified-user" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Approve Gigs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('UserManagement')}
            >
              <Icon name="person-add" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SystemLogs')}
            >
              <Icon name="history" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>System Logs</Text>
            </TouchableOpacity>
          </>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    // removed static chartWidth; width is computed dynamically via Dimensions
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
  actionButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default AdminDashboard;