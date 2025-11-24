import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import HeaderBack from '../../components/HeaderBack';
import { adminApi } from '../../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import { pushToast } from '../../services/toastStore';

const AdminDashboard = ({ navigation }) => {
  const [overview, setOverview] = useState(null);
  const [gigAnalytics, setGigAnalytics] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(
    async ({ silent } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        if (
          (typeof __DEV__ !== 'undefined' && __DEV__) ||
          process?.env?.ALLOW_DEV_TOKENS === 'true'
        ) {
          await ensureTestAuth('firebase-uid-admin1', 'admin');
        }

        const [overviewRes, gigsRes, usersRes] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getGigAnalytics(),
          adminApi.getUserAnalytics(),
        ]);

        setOverview(overviewRes?.data || overviewRes || {});
        setGigAnalytics(gigsRes?.data || gigsRes || {});
        setUserAnalytics(usersRes?.data || usersRes || {});
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        pushToast({ type: 'error', message: 'Failed to refresh admin metrics.' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData({ silent: true });
  };

  const keyStats = useMemo(() => {
    if (!overview) {
      return [];
    }
    const totalUsers =
      (overview.total_students || 0) +
      (overview.total_providers || 0) +
      (overview.total_admins || 0);
    const newUsers = overview.new_users_this_month || 0;
    const lastMonth = overview.new_users_last_month || 0;
    const growthDelta = newUsers - lastMonth;
    const pending = gigAnalytics?.status_breakdown?.pending || overview.pending_gigs_count || 0;
    const completed = overview.completed_gigs_count || 0;
    const active = overview.active_gigs_count || 0;

    return [
      {
        id: 'users',
        title: 'Total Users',
        value: totalUsers,
        icon: 'people',
        color: '#1E3A8A',
        caption: `+${newUsers} new this month`,
        onPress: () => navigation.navigate('UserManagement'),
      },
      {
        id: 'growth',
        title: 'User Growth',
        value: `${growthDelta >= 0 ? '+' : ''}${growthDelta}`,
        icon: 'trending-up',
        color: '#0D9488',
        caption: `${newUsers} this month vs ${lastMonth} last`,
        onPress: () => navigation.navigate('SystemLogs'),
      },
      {
        id: 'active-gigs',
        title: 'Active Gigs',
        value: active,
        icon: 'work',
        color: '#2563EB',
        caption: `${pending} awaiting review`,
        onPress: () => navigation.navigate('ApproveGigs'),
      },
      {
        id: 'completed-gigs',
        title: 'Completed Gigs',
        value: completed,
        icon: 'check-circle',
        color: '#9333EA',
        caption: `${overview.platform_average_rating ?? 0}★ avg rating`,
        onPress: () => navigation.navigate('ApproveGigs'),
      },
    ];
  }, [overview, gigAnalytics, navigation]);

  const userGrowthChart = useMemo(() => {
    const series = userAnalytics?.user_growth || [];
    if (!series.length) {
      return null;
    }
    return {
      labels: series.map((point) => point.month.slice(5)),
      datasets: [
        {
          data: series.map((point) => point.count),
          strokeWidth: 3,
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        },
      ],
    };
  }, [userAnalytics]);

  const roleBreakdown = useMemo(() => {
    const roles = userAnalytics?.users_by_role || {};
    const total = Object.values(roles).reduce((sum, val) => sum + (val || 0), 0);
    if (!total) {
      return [];
    }
    return Object.entries(roles).map(([role, count]) => ({
      role,
      count,
      share: Math.round(((count || 0) / total) * 100),
    }));
  }, [userAnalytics]);

  const gigStatusChips = useMemo(() => {
    const breakdown = gigAnalytics?.status_breakdown || {};
    const mapping = {
      open: { label: 'Open', color: '#10B981' },
      pending: { label: 'Pending', color: '#F59E0B' },
      closed: { label: 'Closed', color: '#6B7280' },
      completed: { label: 'Completed', color: '#6366F1' },
    };
    return Object.entries(mapping).map(([key, meta]) => ({
      ...meta,
      value: breakdown[key] || 0,
    }));
  }, [gigAnalytics]);

  const windowWidth = Math.max(320, Dimensions.get('window').width - 48);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
      }
    >
      <HeaderBack title="Admin Dashboard" backTo="Login" />
      <View style={styles.header}>
        <Text style={styles.title}>Platform Overview</Text>
        <Text style={styles.subtitle}>
          Monitor activity, approvals, and community health in real time.
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {keyStats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={[styles.card, { borderLeftColor: stat.color }]}
            onPress={stat.onPress}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBadge, { backgroundColor: `${stat.color}20` }]}>
              <Icon name={stat.icon} size={22} color={stat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{stat.title}</Text>
              <Text style={styles.cardValue}>{stat.value}</Text>
              <Text style={styles.cardCaption}>{stat.caption}</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#CBD5F5" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>User Growth</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SystemLogs')}>
            <Text style={styles.linkText}>View activity</Text>
          </TouchableOpacity>
        </View>
        {loading && !userGrowthChart ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Loading metrics…</Text>
          </View>
        ) : userGrowthChart ? (
          <LineChart
            data={userGrowthChart}
            width={windowWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#1E3A8A' },
              propsForBackgroundLines: { strokeDasharray: '4 6' },
            }}
            style={styles.chart}
            bezier
          />
        ) : (
          <View style={styles.emptyChart}>
            <Icon name="show-chart" size={20} color="#94A3B8" />
            <Text style={styles.emptyChartText}>No growth data yet.</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gig Pipeline</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ApproveGigs')}>
            <Text style={styles.linkText}>Review pending</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipRow}>
          {gigStatusChips.map((chip) => (
            <View key={chip.label} style={[styles.statusChip, { backgroundColor: `${chip.color}15` }]}> 
              <Icon name="analytics" size={16} color={chip.color} style={{ marginRight: 6 }} />
              <Text style={[styles.statusChipText, { color: chip.color }]}>
                {chip.label}
              </Text>
              <Text style={[styles.statusChipValue, { color: chip.color }]}>{chip.value}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionCaption}>
          Track approvals, completions, and outstanding reviews at a glance.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Community Breakdown</Text>
        {roleBreakdown.length ? (
          roleBreakdown.map((entry) => (
            <View key={entry.role} style={styles.progressRow}>
              <View style={styles.progressLabel}>
                <Icon name="groups" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.progressRole}>{entry.role}</Text>
              </View>
              <Text style={styles.progressValue}>{entry.count}</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${Math.min(entry.share, 100)}%` }]} />
              </View>
              <Text style={styles.progressShare}>{entry.share}%</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyChartText}>Role distribution data not available.</Text>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Top Contributors</Text>
        <View style={styles.contributorGrid}>
          <View style={styles.contributorColumn}>
            <Text style={styles.columnTitle}>Providers</Text>
            {(userAnalytics?.most_active_providers || []).slice(0, 3).map((provider) => (
              <View key={provider.id} style={styles.contributorRow}>
                <Icon name="workspace-premium" size={18} color="#22C55E" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contributorName}>{provider.name}</Text>
                  <Text style={styles.contributorMeta}>{provider.gig_count} gigs</Text>
                </View>
              </View>
            ))}
            {!userAnalytics?.most_active_providers?.length && (
              <Text style={styles.emptyChartText}>No provider data yet.</Text>
            )}
          </View>
          <View style={styles.contributorColumn}>
            <Text style={styles.columnTitle}>Students</Text>
            {(userAnalytics?.most_active_students || []).slice(0, 3).map((student) => (
              <View key={student.id} style={styles.contributorRow}>
                <Icon name="school" size={18} color="#F97316" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contributorName}>{student.name}</Text>
                  <Text style={styles.contributorMeta}>{student.application_count} applications</Text>
                </View>
              </View>
            ))}
            {!userAnalytics?.most_active_students?.length && (
              <Text style={styles.emptyChartText}>No student data yet.</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ApproveGigs')}
        >
          <Icon name="verified-user" size={22} color="#FFFFFF" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.actionButtonText}>Approve Gig Submissions</Text>
            <Text style={styles.actionCaption}>Review new provider listings waiting on you.</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Icon name="people-alt" size={22} color="#FFFFFF" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.actionButtonText}>Manage Accounts & Roles</Text>
            <Text style={styles.actionCaption}>Suspend, delete, or message members.</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SystemLogs')}
        >
          <Icon name="history" size={22} color="#FFFFFF" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.actionButtonText}>Audit Trail</Text>
            <Text style={styles.actionCaption}>Spot recent approvals and account actions.</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: '1%',
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 24,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 6,
  },
  cardCaption: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  linkText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  chart: {
    borderRadius: 12,
    marginTop: 8,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyChartText: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 13,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 8,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusChipValue: {
    marginLeft: 8,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionCaption: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  progressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  progressRole: {
    fontSize: 14,
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  progressValue: {
    width: 40,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  progressShare: {
    width: 42,
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
    fontWeight: '600',
  },
  contributorGrid: {
    flexDirection: 'row',
    marginTop: 12,
  },
  contributorColumn: {
    flex: 1,
    paddingRight: 12,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  contributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  contributorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  contributorMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  quickActions: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionCaption: {
    color: '#E0F2FE',
    fontSize: 13,
    marginTop: 2,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#64748B',
  },
});

export default AdminDashboard;