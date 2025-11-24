// frontendScreens/providerDashboard/ApplicantProfileScreen.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBack from '../../components/HeaderBack';

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

const cleanKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const extractPairs = (source = {}, limit = 12) => {
  if (!source || typeof source !== 'object') {
    return [];
  }
  const pairs = [];
  Object.entries(source).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      pairs.push({ label: cleanKey(key), value: trimmed });
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      pairs.push({ label: cleanKey(key), value: String(value) });
    }
  });
  return pairs.slice(0, limit);
};

function DetailSection({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function KeyValueRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ApplicantProfileScreen({ route }) {
  const {
    student = {},
    gig = {},
    application = {},
    aluIdentity = {},
    supplementalAnswers = {},
    profileSnapshot = {},
    resumeUrl,
  } = route.params || {};

  const resolvedResumeUrl = resumeUrl || application.resume_url || application.resumeUrl;

  const snapshotBackendPairs = useMemo(() => extractPairs(profileSnapshot.backend, 20), [profileSnapshot]);
  const snapshotFirestorePairs = useMemo(() => extractPairs(profileSnapshot.firestore, 20), [profileSnapshot]);
  const aluPairs = useMemo(() => extractPairs(aluIdentity, 20), [aluIdentity]);
  const supplementalPairs = useMemo(() => extractPairs(supplementalAnswers, 20), [supplementalAnswers]);

  const studentName = student.name || student.full_name || 'Student';
  const location = student.location || student.city || 'Location unavailable';
  const email = student.email || student.contact_email || 'No email provided';
  const appliedAt = application.applied_at || application.created_at;
  const status = (application.status || 'pending').toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Student Profile" backTo="ReviewApplications" />

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Applicant</Text>
          <Text style={styles.heroTitle}>{studentName}</Text>
          <Text style={styles.heroSubtitle}>{location}</Text>

          <View style={styles.heroMetaRow}>
            <HeroMeta icon="mail-outline" label="Email" value={email} />
            <HeroMeta icon="calendar-outline" label="Applied" value={formatDate(appliedAt)} />
            <HeroMeta icon="checkmark-done-outline" label="Status" value={status} />
          </View>
        </View>

        {resolvedResumeUrl ? (
          <DetailSection title="Resume">
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL(resolvedResumeUrl).catch(() => {})}
            >
              <Ionicons name="open-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.linkText}>{resolvedResumeUrl}</Text>
            </TouchableOpacity>
          </DetailSection>
        ) : null}

        {aluPairs.length ? (
          <DetailSection title="ALU Identity">
            {aluPairs.map((pair) => (
              <KeyValueRow key={`alu-${pair.label}`} label={pair.label} value={pair.value} />
            ))}
          </DetailSection>
        ) : null}

        {supplementalPairs.length ? (
          <DetailSection title="Supplemental Answers">
            {supplementalPairs.map((pair) => (
              <KeyValueRow key={`supplemental-${pair.label}`} label={pair.label} value={pair.value} />
            ))}
          </DetailSection>
        ) : null}

        {snapshotBackendPairs.length || snapshotFirestorePairs.length ? (
          <DetailSection title="Profile Snapshot">
            {snapshotBackendPairs.map((pair) => (
              <KeyValueRow key={`backend-${pair.label}`} label={pair.label} value={pair.value} />
            ))}
            {snapshotBackendPairs.length && snapshotFirestorePairs.length ? (
              <View style={styles.sectionDivider} />
            ) : null}
            {snapshotFirestorePairs.map((pair) => (
              <KeyValueRow key={`firestore-${pair.label}`} label={pair.label} value={pair.value} />
            ))}
            {profileSnapshot?.captured_at ? (
              <Text style={styles.snapshotFooter}>Snapshot captured {formatDate(profileSnapshot.captured_at)}.</Text>
            ) : null}
          </DetailSection>
        ) : null}

        {gig && Object.keys(gig).length ? (
          <DetailSection title="Gig Summary">
            <KeyValueRow label="Title" value={gig.title || '—'} />
            <KeyValueRow label="Category" value={gig.category || '—'} />
            <KeyValueRow label="Budget" value={gig.price_display || gig.budget || '—'} />
            <KeyValueRow label="Deadline" value={gig.deadline_display || gig.deadline || '—'} />
            <KeyValueRow label="Location" value={gig.location || '—'} />
          </DetailSection>
        ) : null}
      </View>
    </ScrollView>
  );
}

function HeroMeta({ icon, label, value }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color="#1E3A8A" style={{ marginRight: 6 }} />
      <View>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#F4F7FB',
  },
  container: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  heroEyebrow: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  rowLabel: {
    flex: 0.4,
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  rowValue: {
    flex: 0.6,
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 18,
    textAlign: 'right',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  snapshotFooter: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
