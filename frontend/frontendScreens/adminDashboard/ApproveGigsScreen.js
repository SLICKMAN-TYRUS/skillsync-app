import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { adminApi } from '../../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import firestoreAdapter from '../../services/firestoreAdapter';
import { pushToast } from '../../services/toastStore';
import { getSharedEventStream } from '../../services/eventStream';
import HeaderBack from '../../components/HeaderBack';

const ApproveGigsScreen = () => {
  const [gigs, setGigs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [selectedGig, setSelectedGig] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const normalizeGig = useCallback((gig) => {
    if (!gig) return gig;
    const attachments = Array.isArray(gig.attachments)
      ? gig.attachments.filter(Boolean)
      : gig.attachments
        ? [gig.attachments]
        : [];
    const requirements = typeof gig.requirements === 'string' ? gig.requirements.trim() : '';
    const skillsHighlightRaw = gig.skills_highlight || gig.skillsHighlight || '';
    const derivedSkills = Array.isArray(gig.skills_highlight_list)
      ? gig.skills_highlight_list
      : skillsHighlightRaw
        ? skillsHighlightRaw.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean)
        : [];
    return {
      ...gig,
      attachments,
      requirements,
      skills_highlight: skillsHighlightRaw,
      skills_highlight_list: derivedSkills,
    };
  }, []);

  const fetchPendingGigs = useCallback(async ({ silent } = {}) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-admin1', 'admin');
      }
      const response = await adminApi.getPendingGigs();
      const payload = Array.isArray(response.data) ? response.data : [];
      if (!mountedRef.current) {
        return;
      }
      setGigs(payload.map(normalizeGig));
    } catch (error) {
      console.warn('API pending gigs fetch failed, falling back to Firestore:', error?.message || error);
      try {
        const pending = await firestoreAdapter.fetchPendingGigs();
        if (!mountedRef.current) {
          return;
        }
        setGigs((pending || []).map(normalizeGig));
      } catch (e) {
        console.error('Fallback Firestore fetch failed:', e);
      }
    } finally {
      if (!silent) {
        setRefreshing(false);
      }
    }
  }, [normalizeGig]);

  useEffect(() => {
    fetchPendingGigs();
  }, [fetchPendingGigs]);

  const openGigDetails = useCallback(async (gigId) => {
    setDetailVisible(true);
    setDetailLoading(true);
    setDetailError('');
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-admin1', 'admin');
      }
      const response = await adminApi.getGigDetail(gigId);
      if (!mountedRef.current) {
        return;
      }
      setSelectedGig(normalizeGig(response.data));
    } catch (error) {
      console.error('Failed to load gig detail', error);
      if (mountedRef.current) {
        setDetailError(error?.response?.data?.error || error?.message || 'Failed to load gig details');
      }
    } finally {
      if (mountedRef.current) {
        setDetailLoading(false);
      }
    }
  }, [normalizeGig]);

  const closeGigDetails = useCallback(() => {
    setDetailVisible(false);
    setSelectedGig(null);
    setDetailError('');
  }, []);

  useEffect(() => {
    const client = getSharedEventStream();
    if (!client) {
      return undefined;
    }

    const refreshSilently = () => fetchPendingGigs({ silent: true });

    const offMetrics = client.on('metrics_changed', (payload = {}) => {
      if (payload?.scope === 'admin') {
        refreshSilently();
      }
    });

    const offPending = client.on('gig_pending', (payload = {}) => {
      const title = payload?.title || 'New gig submission';
      pushToast({ type: 'info', message: `${title} is awaiting review.` });
      refreshSilently();
    });

    const offApproved = client.on('gig_approved_admin', (payload = {}) => {
      const title = payload?.title || 'Gig';
      pushToast({ type: 'success', message: `${title} approved.` });
      refreshSilently();
    });

    const offRejected = client.on('gig_rejected_admin', (payload = {}) => {
      const title = payload?.title || 'Gig';
      pushToast({ type: 'warning', message: `${title} rejected.` });
      refreshSilently();
    });

    return () => {
      offMetrics();
      offPending();
      offApproved();
      offRejected();
    };
  }, [fetchPendingGigs]);

  const handleApprove = async (gigId) => {
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-admin1', 'admin');
      }
      await adminApi.approveGig(gigId);
      setGigs((prev) => prev.filter((gig) => gig.id !== gigId));
      closeGigDetails();
      pushToast({ type: 'success', message: 'Gig approved successfully.' });
      Alert.alert('Success', 'Gig has been approved');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve gig');
    }
  };

  const handleReject = (gigId) => {
    const defaultReason = 'Rejected by administrator';

    const performReject = async (reasonLabel) => {
      const reason = (reasonLabel || '').trim() || defaultReason;
      try {
        if (
          (typeof __DEV__ !== 'undefined' && __DEV__) ||
          process?.env?.ALLOW_DEV_TOKENS === 'true'
        ) {
          await ensureTestAuth('firebase-uid-admin1', 'admin');
        }
        await adminApi.rejectGig(gigId, reason);
        setGigs((prev) => prev.filter((gig) => gig.id !== gigId));
        closeGigDetails();
        pushToast({ type: 'warning', message: `Gig rejected: ${reason}.` });
        Alert.alert('Success', 'Gig has been rejected');
      } catch (error) {
        Alert.alert('Error', 'Failed to reject gig');
      }
    };

    if (Platform.OS === 'web') {
      const reason = typeof window !== 'undefined'
        ? window.prompt('Enter a reason to send to the provider:', 'Needs additional details')
        : null;
      if (reason === null) {
        return;
      }
      performReject(reason);
      return;
    }

    Alert.alert(
      'Reject Gig',
      'Choose a reason to notify the provider.',
      [
        {
          text: 'Missing details',
          onPress: () => performReject('Missing required information'),
        },
        {
          text: 'Pricing concern',
          onPress: () => performReject('Pricing not aligned with expectations'),
        },
        {
          text: 'Out of scope',
          onPress: () => performReject('Gig is outside SkillSync scope'),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const selectedGigDescriptionChunks = selectedGig?.description
    ? selectedGig.description.split(/\n{2,}/).filter(Boolean)
    : [];
  const selectedGigRequirementItems = selectedGig?.requirements
    ? selectedGig.requirements.split(/\n+|\r+/).map((entry) => entry.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
    : [];

  const renderGigItem = ({ item }) => {
    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    const providerName = item.providerName || item.provider_name || item.provider?.name || 'Provider';
    const priceLabel = item.currency ? `${item.currency} ${item.price ?? item.budget ?? '—'}` : (item.price ?? item.budget ?? '—');
    const timelineLabel = item.duration || item.duration_label || item.deadline_display || 'Flexible timeline';
    const locationLabel = item.location || 'Location TBC';

    return (
      <View style={styles.gigCard}>
        <View style={styles.gigHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.gigTitle}>{item.title}</Text>
            <View style={styles.tagRow}>
              {item.category ? (
                <View style={styles.tagChip}>
                  <Icon name="category" size={14} color="#0b72b9" style={styles.iconSpacerSmall} />
                  <Text style={styles.tagChipText}>{item.category}</Text>
                </View>
              ) : null}
              {locationLabel ? (
                <View style={styles.tagChipMuted}>
                  <Icon name="place" size={14} color="#5C6C80" style={styles.iconSpacerSmall} />
                  <Text style={styles.tagChipMutedText}>{locationLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.gigPrice}>{priceLabel}</Text>
        </View>

        {item.description ? (
          <Text style={styles.gigDescription} numberOfLines={4}>
            {item.description}
          </Text>
        ) : null}

        {item.skills_highlight_list?.length ? (
          <View style={styles.skillChipRow}>
            {item.skills_highlight_list.map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Icon name="bolt" size={14} color="#2563EB" style={styles.iconSpacerSmall} />
                <Text style={styles.skillChipText}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="schedule" size={16} color="#5C6C80" />
            <Text style={styles.metaText}>{timelineLabel}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="person" size={16} color="#5C6C80" />
            <Text style={styles.metaText} numberOfLines={1}>{providerName}</Text>
          </View>
        </View>

        {attachments.length ? (
          <View style={styles.attachmentSection}>
            <Text style={styles.attachmentHeading}>Attachments</Text>
            {attachments.map((url, idx) => (
              <TouchableOpacity
                key={`${url}-${idx}`}
                style={styles.attachmentLink}
                onPress={() => {
                  if (!url) return;
                  Linking.openURL(url).catch(() => Alert.alert('Unable to open attachment', 'Please try again later.'));
                }}
              >
                <Icon name="insert-drive-file" size={16} color="#0b72b9" style={styles.iconSpacerSmall} />
                <Text style={styles.attachmentText} numberOfLines={1}>{url}</Text>
                <Icon name="open-in-new" size={16} color="#0b72b9" style={styles.iconTrailing} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.previewButton]}
            onPress={() => openGigDetails(item.id)}
          >
            <Icon name="visibility" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
          >
            <Icon name="check" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
          >
            <Icon name="close" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBack title="Approve Gigs" backTo="AdminDashboard" />
      <FlatList
        data={gigs}
        renderItem={renderGigItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPendingGigs} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={48} color="#4CAF50" />
            <Text style={styles.emptyText}>No pending gigs to approve</Text>
          </View>
        )}
      />

      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent
        onRequestClose={closeGigDetails}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedGig?.title || 'Gig preview'}</Text>
              <TouchableOpacity onPress={closeGigDetails} style={styles.modalCloseButton}>
                <Icon name="close" size={22} color="#1F2937" />
              </TouchableOpacity>
            </View>
            {detailLoading ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="large" color="#0b72b9" />
                <Text style={styles.loaderText}>Loading gig details…</Text>
              </View>
            ) : detailError ? (
              <View style={styles.modalBody}>
                <Text style={styles.errorText}>{detailError}</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalScrollContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Provider</Text>
                  <Text style={styles.detailValue}>{selectedGig?.provider?.name || selectedGig?.provider_name || 'Unknown provider'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{selectedGig?.category || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{selectedGig?.location || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Budget</Text>
                  <Text style={styles.detailValue}>
                    {selectedGig?.currency ? `${selectedGig.currency} ${selectedGig?.budget ?? '—'}` : selectedGig?.budget ?? '—'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{selectedGig?.duration || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deadline</Text>
                  <Text style={styles.detailValue}>{selectedGig?.deadline || selectedGig?.deadline_display || '—'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Description</Text>
                  {selectedGigDescriptionChunks.length ? (
                    selectedGigDescriptionChunks.map((chunk, idx) => (
                      <Text key={`${idx}-${chunk.slice(0, 10)}`} style={styles.detailText}>
                        {chunk.trim()}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.detailMuted}>No description provided.</Text>
                  )}
                </View>

                {selectedGigRequirementItems.length ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Requirements</Text>
                    {selectedGigRequirementItems.map((entry, idx) => (
                      <View key={`${entry}-${idx}`} style={styles.detailBulletRow}>
                        <View style={styles.detailBulletDot} />
                        <Text style={styles.detailBulletText}>{entry}</Text>
                      </View>
                    ))}
                  </View>
                ) : selectedGig?.requirements ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Requirements</Text>
                    <Text style={styles.detailText}>{selectedGig.requirements}</Text>
                  </View>
                ) : null}

                {selectedGig?.skills_highlight_list?.length ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Highlighted Skills</Text>
                    <View style={styles.detailChipWrap}>
                      {selectedGig.skills_highlight_list.map((skill) => (
                        <View key={skill} style={styles.detailSkillChip}>
                          <Icon name="bolt" size={14} color="#2563EB" style={styles.iconSpacerSmall} />
                          <Text style={styles.detailSkillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : selectedGig?.skills_highlight ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Highlighted Skills</Text>
                    <Text style={styles.detailText}>{selectedGig.skills_highlight}</Text>
                  </View>
                ) : null}

                {selectedGig?.attachments?.length ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Attachments</Text>
                    {selectedGig.attachments.map((url, index) => (
                      <TouchableOpacity
                        key={`${url}-${index}`}
                        style={styles.attachmentLink}
                        onPress={() => {
                          if (!url) return;
                          Linking.openURL(url).catch(() => Alert.alert('Unable to open attachment', 'Please try again later.'));
                        }}
                      >
                        <Icon name="insert-drive-file" size={18} color="#0b72b9" style={styles.iconSpacerSmall} />
                        <Text style={styles.attachmentText} numberOfLines={1}>{url}</Text>
                        <Icon name="open-in-new" size={18} color="#0b72b9" style={styles.iconTrailing} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  gigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: '#E4ECF5',
  },
  gigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gigTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    color: '#102A43',
  },
  gigPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b72b9',
  },
  gigDescription: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 16,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    marginTop: 4,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b72b9',
  },
  tagChipMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipMutedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C6C80',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#5C6C80',
    marginLeft: 6,
  },
  attachmentSection: {
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    paddingTop: 12,
    marginBottom: 16,
  },
  attachmentHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#102A43',
  },
  attachmentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  attachmentText: {
    flex: 1,
    fontSize: 12,
    color: '#0b72b9',
    marginHorizontal: 6,
  },
  iconSpacerSmall: {
    marginRight: 6,
  },
  iconTrailing: {
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    shadowColor: '#0b72b9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  approveButton: {
    backgroundColor: '#22A06B',
  },
  rejectButton: {
    backgroundColor: '#F04438',
  },
  previewButton: {
    backgroundColor: '#2563EB',
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4ECF5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#102A43',
    flex: 1,
    marginRight: 12,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    color: '#475569',
  },
  modalBody: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#1F2937',
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
  detailSection: {
    marginTop: 20,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b72b9',
    marginBottom: 10,
  },
  detailChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
  detailBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0b72b9',
    marginTop: 8,
    marginRight: 10,
  },
  detailBulletText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
    backgroundColor: '#E0ECFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    marginBottom: 8,
  },
  detailSkillText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 12,
    lineHeight: 20,
  },
  detailMuted: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

export default ApproveGigsScreen;