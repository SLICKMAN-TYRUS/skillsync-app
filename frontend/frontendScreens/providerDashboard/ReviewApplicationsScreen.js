// screens/ReviewApplicationsScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBack from '../../components/HeaderBack';
import apiClient, { providerApi, fetchGigById } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import { pushToast } from '../../services/toastStore';

const BRAND_COLORS = {
  primary: '#2B75F6',
  accent: '#FFD166',
  slate: '#0F172A',
  subtle: '#F5F7FB',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const statusColorMap = {
  pending: BRAND_COLORS.warning,
  submitted: BRAND_COLORS.warning,
  accepted: BRAND_COLORS.success,
  rejected: BRAND_COLORS.danger,
  withdrawn: '#6B7280',
  completed: BRAND_COLORS.primary,
};

const cleanKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const extractPairs = (obj = {}, limit = 6) => {
  if (!obj || typeof obj !== 'object') return [];
  const pairs = [];
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'string' || typeof value === 'number') {
      const trimmed = typeof value === 'string' ? value.trim() : value;
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
        return;
      }
      pairs.push({ label: cleanKey(key), value: String(trimmed) });
    }
  });
  return pairs.slice(0, limit);
};

export default function ReviewApplicationsScreen({ route, navigation }) {
  const { gigId } = route.params;
  const [gig, setGig] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [pending, setPending] = useState({});
  const [profileLoading, setProfileLoading] = useState({});

  const sortApplications = useCallback((items = []) => {
    const list = Array.isArray(items) ? items.slice() : [];
    list.sort((a, b) => {
      const aTime = a.applied_at || a.created_at || a.timestamp || '';
      const bTime = b.applied_at || b.created_at || b.timestamp || '';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    return list;
  }, []);

  const loadGig = useCallback(async () => {
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-provider1', 'provider');
      }
      const details = await fetchGigById(gigId).catch(async () => {
        const providerGigs = await providerApi.getGigs();
        const list = Array.isArray(providerGigs) ? providerGigs : providerGigs?.items || [];
        return list.find((item) => item.id === gigId) || null;
      });
      if (details) {
        setGig(details);
      }
    } catch (err) {
      console.error('Failed to load gig context', err);
    }
  }, [gigId]);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-provider1', 'provider');
      }
      const apps = await providerApi.getApplicationsForGig(gigId);
      setApplications(sortApplications(Array.isArray(apps) ? apps : apps?.items || []));
      setError('');
    } catch (err) {
      console.error('Failed to load applications', err);
      setError(err?.message || err?.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [gigId, sortApplications]);

  useEffect(() => {
    loadGig();
    loadApplications();
  }, [loadGig, loadApplications]);

  useEffect(() => {
    if (applications.length === 0) {
      setExpandedId(null);
      return;
    }
    if (!applications.find((item) => item.id === expandedId)) {
      setExpandedId(applications[0].id);
    }
  }, [applications, expandedId]);

  const handleDecision = async (application, action) => {
    if (!application) {
      return;
    }
    const actionLabel = action === 'select' ? 'accept' : 'reject';
    setPending((prev) => ({ ...prev, [application.id]: true }));
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-provider1', 'provider');
      }
      if (action === 'select') {
        await providerApi.selectApplication(application.id);
        pushToast({ type: 'success', message: `Selected ${application.student?.name || 'applicant'} for this gig.` });
      } else {
        await providerApi.rejectApplication(application.id);
        pushToast({ type: 'warning', message: `Notified ${application.student?.name || 'applicant'} about the rejection.` });
      }
      await loadApplications();
    } catch (err) {
      console.error('Application decision failed', err);
      const message = err?.response?.data?.message || err?.message || 'Unable to update application status.';
      setError(message);
      pushToast({ type: 'error', message });
    } finally {
      setPending((prev) => ({ ...prev, [application.id]: false }));
    }
  };

  const headerSummary = useMemo(() => {
    if (!gig) {
      return null;
    }
    return (
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Gig Overview</Text>
        <Text style={styles.heroTitle}>{gig.title || 'Gig'}</Text>
        <Text style={styles.heroSubtitle}>{gig.location || 'Location TBD'}</Text>
        <View style={styles.heroMetaRow}>
          <HeroMeta icon="briefcase-outline" label="Category" value={gig.category || '—'} />
          <HeroMeta icon="cash-outline" label="Budget" value={gig.price_display || gig.budget || '—'} />
          <HeroMeta icon="calendar-outline" label="Deadline" value={gig.deadline_display || gig.deadline || '—'} />
        </View>
        <View style={styles.heroStatusRow}>
          <StatusPill label={gig.status || 'open'} color={statusColorMap[(gig.status || '').toLowerCase()] || BRAND_COLORS.primary} />
          <StatusPill label={`approval: ${(gig.approval_status || 'pending').replace(/_/g, ' ')}`} color={(gig.approval_status || '').toLowerCase() === 'approved' ? BRAND_COLORS.success : BRAND_COLORS.warning} />
          <StatusPill label={`${applications.length} application${applications.length === 1 ? '' : 's'}`} color="#1E3A8A" />
        </View>
      </View>
    );
  }, [gig, applications.length]);

  const openStudentProfile = useCallback(
    async (application) => {
      if (!application?.id) {
        return;
      }
      setProfileLoading((prev) => ({ ...prev, [application.id]: true }));
      try {
        if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
          await ensureTestAuth('firebase-uid-provider1', 'provider');
        }
        const response = await apiClient.get(`/applications/${application.id}/profile-attachment`);
        let payload = response?.data;
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch (parseError) {
            console.warn('Unable to parse profile payload, using raw string.');
            payload = {};
          }
        }
        const envelope = payload && typeof payload === 'object' ? payload : {};
        navigation.navigate('ApplicantProfile', {
          application: envelope.application || application,
          student: envelope.student || application.student || {},
          gig: envelope.gig || gig || {},
          aluIdentity: envelope.alu_identity || application.alu_identity || {},
          supplementalAnswers: envelope.supplemental_answers || application.supplemental_answers || {},
          profileSnapshot: envelope.profile_snapshot || application.profile_snapshot || {},
          resumeUrl: envelope.resume_url || envelope.resumeUrl || application.resume_url,
        });
      } catch (err) {
        console.error('Open profile attachment failed', err);
        const message = err?.response?.data?.message || err?.message || 'Unable to open student profile.';
        pushToast({ type: 'error', message });
      } finally {
        setProfileLoading((prev) => ({ ...prev, [application.id]: false }));
      }
    },
    [gig, navigation],
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <HeaderBack title="Review Applications" backTo="ProviderDashboard" />
        {headerSummary}

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loadingText}>Pulling the latest applications…</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={BRAND_COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={24} color="#64748B" />
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyBody}>Once students submit their interest, their full profile and ALU verification will appear here for review.</Text>
          </View>
        ) : null}

        {applications.map((application, index) => {
          const student = application.student || {};
          const status = (application.status || 'pending').toLowerCase();
          const isExpanded = expandedId === application.id;
          const coverLetter = application.notes || application.message;
          const identityPairs = extractPairs(application.alu_identity, 6);
          const supplementalPairs = extractPairs(application.supplemental_answers, 6);
          const snapshotPairs = extractPairs(application.profile_snapshot?.backend || {}, 6);
          const additionalSnapshotPairs = extractPairs(application.profile_snapshot?.firestore || {}, 4);
          const appliedDisplay = formatDate(application.applied_at);
          const hasProfileAttachment = Boolean(application.id);

          return (
            <View key={application.id} style={styles.applicationCard}>
              <View style={styles.applicantHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(student.name || student.full_name || 'Student')}</Text>
                </View>
                <View style={styles.headerCopy}>
                  <Text style={styles.applicantName}>{student.name || student.full_name || 'Student Applicant'}</Text>
                  <Text style={styles.applicantMeta}>{student.location || student.email || 'ALU student'} • Applied {appliedDisplay}</Text>
                </View>
                <StatusPill label={status} color={statusColorMap[status] || BRAND_COLORS.primary} />
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setExpandedId((prev) => (prev === application.id ? null : application.id))}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                    size={20}
                    color={BRAND_COLORS.slate}
                  />
                </TouchableOpacity>
              </View>

              {isExpanded ? (
                <View style={styles.detailArea}>
                  {coverLetter ? (
                    <DetailSection title="Cover Letter">
                      <Text style={styles.bodyCopy}>{coverLetter}</Text>
                    </DetailSection>
                  ) : null}

                  <DetailSection title="Resume">
                    {application.resume_url ? (
                      <TouchableOpacity
                        style={styles.resumeLink}
                        onPress={() => Linking.openURL(application.resume_url).catch(() => {
                          pushToast({ type: 'error', message: 'Unable to open resume link.' });
                        })}
                      >
                        <Ionicons name="open-outline" size={16} color={BRAND_COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.linkText}>{application.resume_url}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.bodyMuted}>No resume link provided.</Text>
                    )}
                  </DetailSection>

                  {hasProfileAttachment ? (
                    <DetailSection title="Student Profile">
                      <TouchableOpacity
                        style={[styles.attachmentButton, profileLoading[application.id] && styles.buttonDisabled]}
                        onPress={() => openStudentProfile(application)}
                        accessibilityRole="button"
                        disabled={profileLoading[application.id]}
                      >
                        <Ionicons name="person-circle-outline" size={20} color={BRAND_COLORS.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.attachmentLabel}>
                          {profileLoading[application.id] ? 'Opening profile…' : 'View full student profile'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.attachmentHint}>
                        Opens the student's verified details, portfolio links, and captured profile snapshot within the dashboard.
                      </Text>
                    </DetailSection>
                  ) : null}

                  {identityPairs.length ? (
                    <DetailSection title="ALU Identity">
                      {identityPairs.map((item) => (
                        <KeyValueRow key={item.label} label={item.label} value={item.value} />
                      ))}
                    </DetailSection>
                  ) : null}

                  {supplementalPairs.length ? (
                    <DetailSection title="Additional Insights">
                      {supplementalPairs.map((item) => (
                        <KeyValueRow key={item.label} label={item.label} value={item.value} />
                      ))}
                    </DetailSection>
                  ) : null}

                  {snapshotPairs.length || additionalSnapshotPairs.length ? (
                    <DetailSection title="Profile Snapshot">
                      {snapshotPairs.map((item) => (
                        <KeyValueRow key={`backend-${item.label}`} label={item.label} value={item.value} />
                      ))}
                      {additionalSnapshotPairs.length ? (
                        <View style={styles.snapshotDivider} />
                      ) : null}
                      {additionalSnapshotPairs.map((item) => (
                        <KeyValueRow key={`firestore-${item.label}`} label={item.label} value={item.value} />
                      ))}
                      {application.profile_snapshot?.captured_at ? (
                        <Text style={styles.snapshotFooter}>
                          Captured {formatDate(application.profile_snapshot.captured_at)} — includes the student profile state at submission time.
                        </Text>
                      ) : null}
                    </DetailSection>
                  ) : null}

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, pending[application.id] && styles.buttonDisabled]}
                      onPress={() => handleDecision(application, 'reject')}
                      disabled={pending[application.id] || status === 'rejected'}
                      accessibilityRole="button"
                    >
                      <Ionicons name="close-circle-outline" size={16} color={status === 'rejected' ? '#9CA3AF' : BRAND_COLORS.danger} style={{ marginRight: 6 }} />
                      <Text style={[styles.secondaryButtonText, status === 'rejected' && styles.disabledText]}>
                        {status === 'rejected' ? 'Rejected' : pending[application.id] ? 'Updating…' : 'Reject'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryButton, pending[application.id] && styles.buttonDisabled]}
                      onPress={() => handleDecision(application, 'select')}
                      disabled={pending[application.id] || status === 'accepted'}
                      accessibilityRole="button"
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryButtonText}>
                        {status === 'accepted' ? 'Accepted' : pending[application.id] ? 'Updating…' : 'Accept'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {index < applications.length - 1 ? <View style={styles.cardDivider} /> : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function HeroMeta({ icon, label, value }) {
  return (
    <View style={styles.heroMeta}>
      <Ionicons name={icon} size={16} color="#1E3A8A" style={{ marginRight: 6 }} />
      <View>
        <Text style={styles.heroMetaLabel}>{label}</Text>
        <Text style={styles.heroMetaValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatusPill({ label, color }) {
  return (
    <View style={[styles.statusPill, { backgroundColor: color || BRAND_COLORS.primary }]}>
      <Text style={styles.statusPillText}>{label.toUpperCase()}</Text>
    </View>
  );
}

function DetailSection({ title, children }) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function KeyValueRow({ label, value }) {
  return (
    <View style={styles.keyValueRow}>
      <Text style={styles.keyLabel}>{label}</Text>
      <Text style={styles.keyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: BRAND_COLORS.subtle,
  },
  container: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  heroEyebrow: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND_COLORS.slate,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 18,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 12,
  },
  heroMetaLabel: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroMetaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.slate,
  },
  heroStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginHorizontal: 6,
    marginVertical: 4,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  loadingState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderColor: BRAND_COLORS.danger,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  errorText: {
    color: BRAND_COLORS.danger,
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.slate,
  },
  emptyBody: {
    marginTop: 6,
    color: '#475569',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(43,117,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: BRAND_COLORS.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  headerCopy: {
    flex: 1,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.slate,
  },
  applicantMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  expandButton: {
    padding: 6,
    marginLeft: 4,
  },
  detailArea: {
    marginTop: 18,
  },
  detailSection: {
    marginBottom: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bodyCopy: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMuted: {
    color: '#94A3B8',
    fontSize: 13,
  },
  resumeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43,117,246,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  attachmentLabel: {
    color: BRAND_COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  attachmentHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  linkText: {
    color: BRAND_COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
  keyValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  keyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    flex: 0.4,
  },
  keyValue: {
    flex: 0.6,
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 18,
    textAlign: 'right',
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  snapshotFooter: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 10,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    flex: 1,
    marginLeft: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
  },
  secondaryButtonText: {
    color: BRAND_COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 16,
  },
});