import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBack from '../../components/HeaderBack';
import { useNavigation } from '@react-navigation/native';
import { studentApi } from '../../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import { pushToast } from '../../services/toastStore';
import { getSharedEventStream } from '../../services/eventStream';

const PRIMARY_BLUE = '#2B75F6';
const PRIMARY_DARK = '#0F172A';
const ACCENT_GOLD = '#FFD166';
const SOFT_BACKGROUND = '#F5F7FB';
const SOFT_ACCENT = '#E8F1FF';

const MOMENTUM_STEPS = [
  {
    icon: 'sparkles-outline',
    label: 'Refresh your portfolio links',
    detail: 'Ensure your latest prototypes or decks are linked in Profile → Portfolio.',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    label: 'Check your inbox',
    detail: 'Providers may follow up inside SkillSync chat — respond within 24 hours.',
  },
  {
    icon: 'school-outline',
    label: 'Update school details',
    detail: 'Verified academic info boosts trust with new providers.',
  },
];

export default function StudentDashboardScreen() {
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [applicationCount, setApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const navigateTo = useCallback(
    (screen) => {
      navigation.navigate(screen);
    },
    [navigation],
  );

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const shortcuts = useMemo(
    () => [
      {
        icon: 'briefcase-outline',
        label: 'Browse Gigs',
        target: 'GigsScreen',
        accent: SOFT_ACCENT,
        iconColor: PRIMARY_BLUE,
      },
      {
        icon: 'bookmark-outline',
        label: 'Saved Gigs',
        target: 'SavedGigsScreen',
        accent: 'rgba(255,209,102,0.22)',
        iconColor: ACCENT_GOLD,
      },
      {
        icon: 'document-text-outline',
        label: 'My Applications',
        target: 'MyApplicationsScreen',
        accent: 'rgba(43,117,246,0.1)',
        iconColor: PRIMARY_BLUE,
      },
      {
        icon: 'notifications-outline',
        label: 'Notifications',
        target: 'NotificationsScreen',
        accent: 'rgba(43,117,246,0.08)',
        iconColor: PRIMARY_BLUE,
      },
      {
        icon: 'checkmark-done-outline',
        label: 'Completed Gigs',
        target: 'CompletedGigsScreen',
        accent: SOFT_ACCENT,
        iconColor: PRIMARY_BLUE,
      },
      {
        icon: 'chatbubbles-outline',
        label: 'Inbox & Chat',
        target: 'InboxScreen',
        accent: '#FFFFFF',
        iconColor: PRIMARY_DARK,
      },
      {
        icon: 'star-outline',
        label: 'Rate Providers',
        target: 'RateProviderScreen',
        accent: 'rgba(255,209,102,0.2)',
        iconColor: ACCENT_GOLD,
      },
      {
        icon: 'person-outline',
        label: 'My Profile',
        target: 'ProfileScreen',
        accent: 'rgba(43,117,246,0.1)',
        iconColor: PRIMARY_BLUE,
      },
    ],
    [],
  );

  const heroCallouts = useMemo(
    () => [
      {
        label: 'Active Applications',
        value: applicationCount,
        hint:
          applicationCount > 0
            ? 'Track interviews and follow-ups in My Applications.'
            : 'Start an application this week to keep momentum.',
      },
      {
        label: 'Weekly Focus',
        value: 'Build portfolio evidence',
        hint: 'Document recent wins so providers can see your impact.',
      },
    ],
    [applicationCount],
  );

  const loadApplications = useCallback(
    async ({ silent } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        if ((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true') {
          await ensureTestAuth('firebase-uid-student1', 'student');
        }
        const apps = await studentApi.getMyApplications();
        if (!mountedRef.current) {
          return;
        }
        const appsList = Array.isArray(apps) ? apps : apps?.items || [];
        setApplicationCount(appsList.length);
        if (!silent) {
          setError('');
        }
      } catch (err) {
        console.warn('Failed to fetch applications', err);
        if (!mountedRef.current) {
          return;
        }
        if (!silent) {
          setError('We hit a snag while syncing your applications. Tap retry or refresh in a moment.');
        }
      } finally {
        if (!mountedRef.current) {
          return;
        }
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    const client = getSharedEventStream();
    if (!client) {
      return undefined;
    }

    const offGigUpdated = client.on('gig_updated', (payload = {}) => {
      const title = payload?.title || 'A gig you follow';
      const reason = (payload?.reason || '').toLowerCase();
      if (reason === 'approved') {
        pushToast({ type: 'success', message: `${title} was approved.` });
      } else if (reason === 'rejected') {
        pushToast({ type: 'warning', message: `${title} was rejected.` });
      } else if (reason) {
        pushToast({ type: 'info', message: `${title} updated (${reason}).` });
      }
      loadApplications({ silent: true });
    });

    const offMetrics = client.on('metrics_changed', (payload = {}) => {
      if (payload?.scope === 'student') {
        loadApplications({ silent: true });
      }
    });

    return () => {
      offGigUpdated();
      offMetrics();
    };
  }, [loadApplications]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <HeaderBack title="Student Dashboard" backTo="Login" />
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Welcome back</Text>
        <Text style={styles.heroTitle}>Shape your next SkillSync milestone</Text>
        <Text style={styles.heroSubtitle}>
          Keep an eye on your applications, document your wins, and explore fresh Kigali gigs tailored for ALU talent.
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={[styles.heroButton, styles.heroPrimary]} onPress={() => navigateTo('GigsScreen')}>
            <Ionicons name="rocket-outline" size={18} color="#1E3A8A" style={styles.heroButtonIcon} />
            <Text style={styles.heroPrimaryText}>Browse New Gigs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.heroButton, styles.heroSecondary]} onPress={() => navigateTo('ProfileScreen')}>
            <Ionicons name="create-outline" size={18} color="#EEF2FF" style={styles.heroButtonIcon} />
            <Text style={styles.heroSecondaryText}>Polish Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroStatsRow}>
          {heroCallouts.map((item) => (
            <View key={item.label} style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>{item.label}</Text>
              <Text style={styles.heroStatValue}>{item.value}</Text>
              <Text style={styles.heroStatHint}>{item.hint}</Text>
            </View>
          ))}
        </View>
      </View>

      {error ? (
        <View style={styles.inlineAlert}>
          <View style={styles.inlineAlertIcon}>
            <Ionicons name="cloud-offline-outline" size={18} color="#1D4ED8" />
          </View>
          <View style={styles.inlineAlertCopy}>
            <Text style={styles.inlineAlertTitle}>Applications paused</Text>
            <Text style={styles.inlineAlertBody}>{error}</Text>
          </View>
          <TouchableOpacity
            style={styles.inlineAlertAction}
            onPress={() => loadApplications({ silent: false })}
            accessibilityRole="button"
          >
            <Text style={styles.inlineAlertActionText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.shortcutGrid}>
        {shortcuts.map((shortcut) => (
          <ShortcutTile
            key={shortcut.label}
            icon={shortcut.icon}
            label={shortcut.label}
            accent={shortcut.accent}
            iconColor={shortcut.iconColor}
            onPress={() => navigateTo(shortcut.target)}
          />
        ))}
      </View>

      <DashboardSection title="Today’s Focus">
        {loading ? (
          <Text style={styles.placeholder}>Refreshing your activity feed…</Text>
        ) : applicationCount > 0 ? (
          <Text style={styles.placeholder}>
            You have {applicationCount} application{applicationCount !== 1 ? 's' : ''} in flight. Nudge providers, prep follow-up notes, and capture any new learning in your profile.
          </Text>
        ) : (
          <Text style={styles.placeholder}>
            No applications yet. Shortlist three gigs that excite you and send at least one application before the weekend.
          </Text>
        )}
      </DashboardSection>

      <DashboardSection title="Momentum Builders">
        <View style={styles.timeline}>
          {MOMENTUM_STEPS.map((item) => (
            <TimelineRow key={item.label} icon={item.icon} label={item.label} detail={item.detail} />
          ))}
        </View>
      </DashboardSection>
    </ScrollView>
  );
}

function ShortcutTile({ icon, label, accent, iconColor, onPress }) {
  const { width } = Dimensions.get('window');
  const isSmall = width < 420;

  return (
    <TouchableOpacity
      style={[
        styles.shortcutTile,
        { backgroundColor: accent },
        isSmall && styles.shortcutTileSmall,
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.shortcutIconWrap, { backgroundColor: iconColor }]}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function DashboardSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TimelineRow({ icon, label, detail }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineIconWrapper}>
        <Ionicons name={icon} size={18} color="#1D4ED8" />
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: SOFT_BACKGROUND,
  },
  heroCard: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#1F4AAE',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 18,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  heroButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginHorizontal: 6,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroButtonIcon: {
    marginRight: 8,
  },
  heroPrimary: {
    backgroundColor: '#FFFFFF',
  },
  heroPrimaryText: {
    color: PRIMARY_BLUE,
    fontWeight: '700',
  },
  heroSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  heroSecondaryText: {
    color: '#EEF2FF',
    fontWeight: '600',
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  inlineAlert: {
    backgroundColor: '#E8F1FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C7DAFF',
  },
  inlineAlertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inlineAlertCopy: {
    flex: 1,
  },
  inlineAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY_BLUE,
    marginBottom: 4,
  },
  inlineAlertBody: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  inlineAlertAction: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  inlineAlertActionText: {
    color: PRIMARY_BLUE,
    fontWeight: '700',
  },
  heroStatCard: {
    flexBasis: '48%',
    backgroundColor: 'rgba(248,250,255,0.18)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  heroStatHint: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  shortcutTile: {
    width: '48%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  shortcutTileSmall: {
    width: '100%',
  },
  shortcutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shortcutLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  section: {
    marginBottom: 26,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    shadowColor: '#1E293B',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  placeholder: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  timeline: {
    marginTop: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#E0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  timelineDetail: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },
});
