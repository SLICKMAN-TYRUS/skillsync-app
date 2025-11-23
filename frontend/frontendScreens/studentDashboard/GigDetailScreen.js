// screens/GigDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { fetchGigById, applyToGig, fetchCurrentProfile } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';

export default function GigDetailScreen({ route }) {
  const params = route?.params || {};
  const initialGig = params.gig || null;
  const resolvedGigId = initialGig?.id || params.gigId || null;
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gigData, setGigData] = useState(initialGig);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (initialGig) {
      setGigData((prev) => {
        if (prev && prev.id === initialGig.id) {
          return prev;
        }
        return initialGig;
      });
    }
  }, [initialGig]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!resolvedGigId) {
        return;
      }
      setLoading(true);
      try {
        if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
          await ensureTestAuth('firebase-uid-student1', 'student');
        }
        const data = await fetchGigById(resolvedGigId);
        if (active) {
          setGigData(data);
          setError('');
        }
      } catch (err) {
        console.error('Failed to fetch gig details', err);
        if (active) {
          setError(err?.message || err?.response?.data?.error || 'Failed to load gig details');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [resolvedGigId]);

  const safeGig = gigData || {};
  const attachments = Array.isArray(safeGig.attachments) ? safeGig.attachments.filter(Boolean) : [];
  const descriptionChunks = typeof safeGig.description === 'string'
    ? safeGig.description.split(/\n{2,}/).filter((chunk) => chunk.trim().length > 0)
    : [];
  const requirementsText = typeof safeGig.requirements === 'string' ? safeGig.requirements.trim() : '';
  const requirementItems = requirementsText
    ? requirementsText.split(/\n+|\r+/).map((item) => item.replace(/^[-•]\s*/, '').trim()).filter((item) => item.length > 0)
    : [];
  const skillsHighlightRaw = safeGig.skills_highlight || safeGig.skillsHighlight || '';
  const skillsHighlightList = Array.isArray(safeGig.skills_highlight_list)
    ? safeGig.skills_highlight_list
    : skillsHighlightRaw
      ? skillsHighlightRaw.split(/[\n,]+/).map((item) => item.trim()).filter((item) => item.length > 0)
      : [];
  const summaryItems = [
    safeGig.deadline || safeGig.deadline_display
      ? { label: 'Deadline', value: safeGig.deadline || safeGig.deadline_display }
      : null,
    safeGig.duration
      ? { label: 'Duration', value: safeGig.duration }
      : null,
    typeof safeGig.application_count === 'number'
      ? { label: 'Applicants', value: safeGig.application_count }
      : null,
    safeGig.provider?.name
      ? { label: 'Posted By', value: safeGig.provider.name }
      : null,
    safeGig.status
      ? { label: 'Status', value: safeGig.status.replace(/_/g, ' ') }
      : null,
    safeGig.approval_status
      ? { label: 'Approval', value: safeGig.approval_status.replace(/_/g, ' ') }
      : null,
  ].filter(Boolean);
  const providerProfile = safeGig.provider;
  const canMessageProvider = Boolean(providerProfile);
  const canApply = safeGig.approval_status === 'approved' && (safeGig.status === 'open' || safeGig.status === undefined);
  const applyLabel = safeGig.approval_status !== 'approved'
    ? 'Awaiting Approval'
    : safeGig.status === 'open' || safeGig.status === undefined
      ? 'Apply to Gig'
      : 'Applications Closed';

  useEffect(() => {
    if (!resolvedGigId) {
      setError('No gig selected');
    }
  }, [resolvedGigId]);

  const handleMessageProvider = () => {
    if (!canMessageProvider) {
      setError('Provider details are unavailable.');
      return;
    }
    navigation.navigate('ChatScreen', { sender: providerProfile });
  };

  const handleApply = async () => {
    if (!canApply) {
      setError('Applications are not open for this gig yet.');
      return;
    }
    if (!safeGig.id) {
      setError('Gig details are still loading. Please try again.');
      return;
    }

    let profile = null;
    let resumeUrl = null;

    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }
      profile = await fetchCurrentProfile().catch(() => null);
      resumeUrl = profile?.resumeUrl || profile?.resume_url || profile?.resumeURL || null;

      Alert.alert(
        'Confirm Application',
        resumeUrl
          ? 'Submit your application for this gig?'
          : 'Submit your application for this gig? You can upload a resume later from your profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply',
            onPress: async () => {
              try {
                setApplying(true);
                if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
                  await ensureTestAuth('firebase-uid-student1', 'student');
                }
                const payload = {};
                if (resumeUrl) {
                  payload.resume_url = resumeUrl;
                }
                await applyToGig(safeGig.id, payload);
                Alert.alert('Applied', 'Your application has been submitted');
                navigation.navigate('ApplicationConfirmationScreen', { gigId: safeGig.id, gigTitle: safeGig.title });
              } catch (err) {
                console.error('Apply failed', err);
                setError(err?.message || err?.response?.data?.message || 'Failed to apply');
              } finally {
                setApplying(false);
              }
            },
          },
        ],
      );
    } catch (err) {
      console.error('Apply flow failed', err);
      setError('Something went wrong — please try again');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Gig Details" backTo="GigsScreen" />
        <ErrorBanner message={error} onClose={() => setError('')} />
        {loading ? (
          <ActivityIndicator size="large" color="#0077cc" />
        ) : (
          <>
            <Text style={styles.title}>{safeGig.title || 'Gig'}</Text>
            <View style={styles.metaRow}>
              {safeGig.category ? <Text style={styles.metaPill}>{safeGig.category}</Text> : null}
              {safeGig.location ? <Text style={styles.metaPill}>{safeGig.location}</Text> : null}
              {safeGig.currency || safeGig.budget ? (
                <Text style={styles.metaPill}>
                  {safeGig.currency ? `${safeGig.currency} ` : ''}{safeGig.budget ?? safeGig.price ?? '—'}
                </Text>
              ) : null}
            </View>
            {summaryItems.length ? (
              <View style={styles.summaryCard}>
                {summaryItems.map((item, index) => (
                  <View
                    key={`${item.label}-${index}`}
                    style={[
                      styles.summaryRow,
                      index < summaryItems.length - 1 ? styles.summaryRowDivider : null,
                    ]}
                  >
                    <Text style={styles.summaryLabel}>{item.label}</Text>
                    <Text style={styles.summaryValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opportunity Overview</Text>
              {descriptionChunks.length ? (
                descriptionChunks.map((chunk, idx) => (
                  <Text key={`${idx}-${chunk.slice(0, 12)}`} style={styles.description}>{chunk.trim()}</Text>
                ))
              ) : (
                <Text style={styles.descriptionMuted}>No description provided yet.</Text>
              )}
            </View>

            {requirementItems.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Requirements</Text>
                {requirementItems.map((item, idx) => (
                  <View key={`${item}-${idx}`} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : requirementsText ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Requirements</Text>
                <Text style={styles.description}>{requirementsText}</Text>
              </View>
            ) : null}

            {skillsHighlightList.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Highlighted Skills</Text>
                <View style={styles.chipRow}>
                  {skillsHighlightList.map((skill) => (
                    <View key={skill} style={styles.chip}>
                      <Text style={styles.chipText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {attachments.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attachments</Text>
                {attachments.map((url, idx) => (
                  <TouchableOpacity
                    key={`${url}-${idx}`}
                    style={styles.attachmentRow}
                    onPress={() => {
                      if (!url) return;
                      Linking.openURL(url).catch(() => Alert.alert('Unable to open attachment', 'Try again later.'));
                    }}
                  >
                    <Text numberOfLines={1} style={styles.attachmentText}>{url}</Text>
                    <Text style={styles.attachmentCTA}>Open</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleMessageProvider}
          disabled={!canMessageProvider}
        >
          <Text style={styles.buttonText}>{canMessageProvider ? 'Message Provider' : 'Provider Unavailable'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: canApply ? '#28a745' : '#9CA3AF', marginTop: 12, opacity: canApply ? 1 : 0.7 }]}
          onPress={handleApply}
          disabled={!canApply || applying}
        >
          <Text style={styles.buttonText}>{applying ? 'Submitting…' : applyLabel}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  container: {
    width: '90%',
    maxWidth: 500,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 10,
    textAlign: 'center',
  },
  meta: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  metaPill: {
    backgroundColor: '#E8F1FF',
    color: '#0b72b9',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginHorizontal: 6,
    marginVertical: 4,
  },
  metaList: {
    alignItems: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#444',
    marginBottom: 12,
    lineHeight: 22,
    textAlign: 'left',
  },
  descriptionMuted: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'left',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b72b9',
    marginBottom: 12,
    textAlign: 'left',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    marginLeft: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#0369A1',
    fontWeight: '600',
    fontSize: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0b72b9',
    marginTop: 8,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  attachmentRow: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentText: {
    color: '#0b72b9',
    fontSize: 13,
    flex: 1,
    marginRight: 16,
  },
  attachmentCTA: {
    color: '#0b72b9',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});