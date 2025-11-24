// screens/GigDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { fetchGigById, applyToGig, fetchCurrentProfile } from '../services/api';
import { fetchUserProfile } from '../../services/firestoreAdapter';
import { firebaseAuth } from '../../services/firebaseConfig';
import { ensureTestAuth } from '../../services/devAuth';
import { pushToast } from '../../services/toastStore';

export default function GigDetailScreen({ route }) {
  const params = route?.params || {};
  const initialGig = params.gig || null;
  const resolvedGigId = initialGig?.id || params.gigId || null;
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gigData, setGigData] = useState(initialGig);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationNotes, setApplicationNotes] = useState('');
  const [profileResumeUrl, setProfileResumeUrl] = useState('');
  const [prefetchingProfile, setPrefetchingProfile] = useState(false);
  const [aluEmail, setAluEmail] = useState('');
  const [aluStudentId, setAluStudentId] = useState('');
  const [aluProgram, setAluProgram] = useState('');
  const [aluVerificationUrl, setAluVerificationUrl] = useState('');
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [extraInformation, setExtraInformation] = useState('');
  const [valueAdd, setValueAdd] = useState('');
  const [profileSnapshot, setProfileSnapshot] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

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

  useEffect(() => {
    if (!resolvedGigId) {
      setError('No gig selected');
    }
  }, [resolvedGigId]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setSuccessMessage(''), 6000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

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

  const prefillResumeFromProfile = async () => {
    if (prefetchingProfile) {
      return;
    }
    setPrefetchingProfile(true);
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }

      const backendProfile = await fetchCurrentProfile().catch(() => null);
      const authUid = firebaseAuth?.currentUser?.uid || backendProfile?.uid || backendProfile?.firebase_uid || null;

      let firestoreProfile = null;
      if (authUid) {
        try {
          firestoreProfile = await fetchUserProfile(authUid);
        } catch (err) {
          firestoreProfile = null;
        }
      }

      const rawFirestore = firestoreProfile?._raw || {};
      let resumeUrl = backendProfile?.resume_url || backendProfile?.resumeUrl || backendProfile?.resumeURL || '';
      if (!resumeUrl) {
        resumeUrl = rawFirestore.resumeUrl || rawFirestore.resumeURL || rawFirestore.resume || '';
      }
      if (typeof resumeUrl === 'string' && resumeUrl.trim().length) {
        setProfileResumeUrl(resumeUrl.trim());
      }

      const schoolSource = backendProfile?.schoolDetails || rawFirestore.schoolDetails || rawFirestore.school || {};
      const identityRaw = rawFirestore.aluIdentity || rawFirestore.identity || {};
      const derivedIdentity = {
        aluEmail:
          identityRaw.aluEmail ||
          backendProfile?.alu_email ||
          backendProfile?.aluEmail ||
          (typeof backendProfile?.email === 'string' && backendProfile.email.endsWith('@alueducation.com')
            ? backendProfile.email
            : rawFirestore.email || ''),
        aluStudentId:
          identityRaw.aluStudentId ||
          schoolSource?.studentIdNumber ||
          schoolSource?.studentId ||
          backendProfile?.student_id_number ||
          backendProfile?.studentIdNumber ||
          rawFirestore.studentIdNumber ||
          '',
        aluProgram:
          identityRaw.aluProgram ||
          schoolSource?.program ||
          schoolSource?.course ||
          backendProfile?.program ||
          backendProfile?.school_program ||
          '',
        verificationUrl:
          identityRaw.verificationUrl ||
          backendProfile?.universityIdUrl ||
          rawFirestore.universityIdUrl ||
          rawFirestore.verificationUrl ||
          '',
      };

      setAluEmail(derivedIdentity.aluEmail || '');
      setAluStudentId(derivedIdentity.aluStudentId || '');
      setAluProgram(derivedIdentity.aluProgram || '');
      setAluVerificationUrl(derivedIdentity.verificationUrl || '');

      const derivedAvailability = backendProfile?.availability || rawFirestore.availability || '';
      setAvailabilityNotes(derivedAvailability || '');

      const rawHighlights = rawFirestore.extraInformation || rawFirestore.additionalInformation || '';
      setExtraInformation(rawHighlights || '');
      const rawValueAdd = rawFirestore.valueAdd || rawFirestore.uniqueValue || '';
      setValueAdd(rawValueAdd || '');

      const snapshotPayload = {
        backend: backendProfile || {},
        firestore: rawFirestore,
        captured_at: new Date().toISOString(),
      };
      setProfileSnapshot(snapshotPayload);
    } catch (err) {
      console.error('Failed to prefill profile details', err);
    } finally {
      setPrefetchingProfile(false);
    }
  };

  const handleMessageProvider = () => {
    if (!canMessageProvider) {
      setError('Provider details are unavailable.');
      return;
    }
    navigation.navigate('ChatScreen', { sender: providerProfile });
  };

  const handleOpenApplyForm = () => {
    if (!canApply) {
      setError('Applications are not open for this gig yet.');
      return;
    }
    if (!safeGig.id) {
      setError('Gig details are still loading. Please try again.');
      return;
    }
    setError('');
    setApplicationNotes('');
    setAluEmail('');
    setAluStudentId('');
    setAluProgram('');
    setAluVerificationUrl('');
    setAvailabilityNotes('');
    setExtraInformation('');
    setValueAdd('');
    setShowApplyForm(true);
    setSuccessMessage('');
    prefillResumeFromProfile();
  };

  const handleCancelApply = () => {
    if (applying) {
      return;
    }
    setShowApplyForm(false);
    setApplicationNotes('');
  };

  const handleSubmitApplication = async () => {
    if (!safeGig.id) {
      setError('Gig details are still loading. Please try again.');
      return;
    }
    try {
      setApplying(true);
      setError('');
      const requiredAluEmail = aluEmail.trim();
      const requiredAluId = aluStudentId.trim();
      if (!requiredAluEmail || !requiredAluId) {
        setError('Please provide your ALU student email and ID to continue.');
        Alert.alert('Missing ALU Credentials', 'Add your ALU email and student ID before submitting.');
        return;
      }
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }
      const payload = {};
      const trimmedNotes = applicationNotes.trim();
      const trimmedResume = profileResumeUrl.trim();
      if (trimmedNotes) {
        payload.notes = trimmedNotes;
      }
      if (trimmedResume) {
        payload.resume_url = trimmedResume;
        setProfileResumeUrl(trimmedResume);
      }

      const identityPayload = {
        alu_email: requiredAluEmail,
        alu_student_id: requiredAluId,
        alu_program: aluProgram.trim(),
        verification_url: aluVerificationUrl.trim(),
      };
      const sanitizedIdentity = Object.fromEntries(
        Object.entries(identityPayload).filter(([, value]) => typeof value === 'string' && value.length > 0),
      );
      if (Object.keys(sanitizedIdentity).length) {
        payload.alu_identity = sanitizedIdentity;
      }

      const supplementalAnswers = {};
      const availabilityTrimmed = availabilityNotes.trim();
      if (availabilityTrimmed) {
        supplementalAnswers.availability_notes = availabilityTrimmed;
      }
      const extraTrimmed = extraInformation.trim();
      if (extraTrimmed) {
        supplementalAnswers.additional_information = extraTrimmed;
      }
      const valueAddTrimmed = valueAdd.trim();
      if (valueAddTrimmed) {
        supplementalAnswers.value_add = valueAddTrimmed;
      }
      if (Object.keys(supplementalAnswers).length) {
        payload.supplemental_answers = supplementalAnswers;
      }

      if (profileSnapshot) {
        payload.profile_snapshot = {
          ...profileSnapshot,
          submitted_at: new Date().toISOString(),
          application_context: {
            notes: trimmedNotes || null,
            resume_url: trimmedResume || null,
            alu_identity: Object.keys(sanitizedIdentity).length ? sanitizedIdentity : null,
            supplemental_answers: Object.keys(supplementalAnswers).length ? supplementalAnswers : null,
          },
        };
      }

      await applyToGig(safeGig.id, payload);
      setShowApplyForm(false);
      setApplicationNotes('');
      setAvailabilityNotes('');
      setExtraInformation('');
      setValueAdd('');
      setAluEmail('');
      setAluStudentId('');
      setAluProgram('');
      setAluVerificationUrl('');
      setProfileSnapshot(null);
      const confirmationMessage = 'Application submitted! The provider has been notified to review your profile.';
      setSuccessMessage(confirmationMessage);
      pushToast({ type: 'success', message: confirmationMessage, duration: 6000 });
      Alert.alert('Application Submitted', 'We shared your full profile and verification details with the provider.');
      navigation.navigate('ApplicationConfirmationScreen', { gigId: safeGig.id, gigTitle: safeGig.title });
    } catch (err) {
      console.error('Apply failed', err);
      setError(err?.message || err?.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <HeaderBack title="Gig Details" backTo="GigsScreen" />
        <ErrorBanner message={error} onClose={() => setError('')} />
        {successMessage ? (
          <View style={styles.successBanner} accessibilityRole="status">
            <Text style={styles.successBannerText}>{successMessage}</Text>
          </View>
        ) : null}
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

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryAction,
              !canMessageProvider ? styles.actionButtonDisabled : null,
            ]}
            onPress={handleMessageProvider}
            disabled={!canMessageProvider}
          >
            <Text
              style={[
                styles.actionText,
                !canMessageProvider ? styles.actionTextDisabled : null,
              ]}
            >
              {canMessageProvider ? 'Message Provider' : 'Provider Unavailable'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryAction,
              (!canApply || applying) ? styles.primaryActionDisabled : null,
            ]}
            onPress={handleOpenApplyForm}
            disabled={!canApply || applying}
          >
            <Text
              style={[
                styles.actionTextPrimary,
                (!canApply || applying) ? styles.actionTextDisabled : null,
              ]}
            >
              {applying ? 'Submitting…' : applyLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {showApplyForm ? (
          <View style={styles.applyOverlay}>
            <View style={styles.applyCard}>
              <ScrollView
                contentContainerStyle={styles.applyCardScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                <Text style={styles.applyTitle}>Submit Application</Text>
                <Text style={styles.applySubtitle}>Add a short message for the provider and confirm the resume link we will share.</Text>
                {prefetchingProfile ? (
                  <View style={styles.applyLoadingRow}>
                    <ActivityIndicator size="small" color="#0b72b9" />
                    <Text style={styles.applyLoadingText}>Fetching profile details…</Text>
                  </View>
                ) : null}
                <Text style={styles.applyFieldLabel}>Message</Text>
                <TextInput
                  style={[styles.applyInput, styles.applyTextarea]}
                  placeholder="Introduce yourself and highlight why you're a good fit."
                  multiline
                  numberOfLines={4}
                  value={applicationNotes}
                  onChangeText={setApplicationNotes}
                  textAlignVertical="top"
                />
                <Text style={styles.applyFieldLabel}>Resume Link</Text>
                <TextInput
                  style={styles.applyInput}
                  placeholder="https://resume-link.example"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={profileResumeUrl}
                  onChangeText={setProfileResumeUrl}
                />
                <Text style={styles.applyHint}>You can update your resume link anytime from your profile.</Text>

                <Text style={styles.applySectionTitle}>ALU Identity Verification</Text>
                <Text style={styles.applySectionDescription}>
                  Confirm your ALU student credentials so providers can trust your profile instantly.
                </Text>
                <Text style={styles.applyFieldLabel}>ALU Student Email</Text>
                <TextInput
                  style={styles.applyInput}
                  placeholder="firstname.lastname@alueducation.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={aluEmail}
                  onChangeText={setAluEmail}
                />
                <Text style={styles.applyFieldLabel}>ALU Student ID</Text>
                <TextInput
                  style={styles.applyInput}
                  placeholder="e.g., ALU-2025-1234"
                  autoCapitalize="characters"
                  value={aluStudentId}
                  onChangeText={setAluStudentId}
                />
                <Text style={styles.applyFieldLabel}>Program / Cohort</Text>
                <TextInput
                  style={styles.applyInput}
                  placeholder="e.g., Software Engineering, Class of 2026"
                  value={aluProgram}
                  onChangeText={setAluProgram}
                />
                <Text style={styles.applyFieldLabel}>Verification Document URL</Text>
                <TextInput
                  style={styles.applyInput}
                  placeholder="Secure link to ALU ID or enrollment letter"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={aluVerificationUrl}
                  onChangeText={setAluVerificationUrl}
                />

                <Text style={styles.applySectionTitle}>Additional Profile Highlights</Text>
                <Text style={styles.applySectionDescription}>
                  Share context that is not obvious from your resume. These insights travel with your application.
                </Text>
                <Text style={styles.applyFieldLabel}>Availability Notes</Text>
                <TextInput
                  style={styles.applyInput}
                  placeholder="e.g., Available weekdays after 5pm, full weekends"
                  value={availabilityNotes}
                  onChangeText={setAvailabilityNotes}
                />
                <Text style={styles.applyFieldLabel}>Unique Value Add</Text>
                <TextInput
                  style={[styles.applyInput, styles.applyTextarea]}
                  placeholder="What makes you uniquely suited for this opportunity?"
                  multiline
                  numberOfLines={3}
                  value={valueAdd}
                  onChangeText={setValueAdd}
                  textAlignVertical="top"
                />
                <Text style={styles.applyFieldLabel}>Additional Information</Text>
                <TextInput
                  style={[styles.applyInput, styles.applyTextarea]}
                  placeholder="Any extra context you'd like the provider to review (links, achievements, commitments)."
                  multiline
                  numberOfLines={4}
                  value={extraInformation}
                  onChangeText={setExtraInformation}
                  textAlignVertical="top"
                />
              </ScrollView>
              <View style={styles.applyActions}>
                <TouchableOpacity
                  style={[styles.applyActionButton, styles.applyCancelButton]}
                  onPress={handleCancelApply}
                  disabled={applying}
                >
                  <Text style={[styles.applyActionText, styles.applyCancelText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.applyActionButton,
                    styles.applyPrimaryButton,
                    applying || prefetchingProfile ? styles.applyDisabledButton : null,
                  ]}
                  onPress={handleSubmitApplication}
                  disabled={applying || prefetchingProfile}
                >
                  <Text style={styles.applyActionText}>{applying ? 'Submitting…' : 'Submit Application'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#EEF2FF',
  },
  container: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 36,
    paddingVertical: 32,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
    position: 'relative',
  },
  successBanner: {
    backgroundColor: '#0f9d58',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  successBannerText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0b72b9',
    marginBottom: 12,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  metaPill: {
    backgroundColor: '#E8F1FF',
    color: '#0b72b9',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginHorizontal: 6,
    marginVertical: 4,
  },
  description: {
    fontSize: 15,
    color: '#334155',
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
    marginBottom: 24,
    backgroundColor: '#F9FBFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0b72b9',
    marginBottom: 12,
    textAlign: 'left',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
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
  attachmentRow: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 28,
    marginHorizontal: -8,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: 240,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginHorizontal: 8,
    marginVertical: 6,
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  primaryAction: {
    backgroundColor: '#2563EB',
  },
  primaryActionDisabled: {
    backgroundColor: '#93C5FD',
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1E293B',
  },
  actionTextPrimary: {
    fontWeight: '700',
    fontSize: 16,
    color: '#FFFFFF',
  },
  actionTextDisabled: {
    opacity: 0.8,
  },
  applyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  applyCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    overflow: 'hidden',
  },
  applyCardScroll: {
    paddingHorizontal: 32,
    paddingVertical: 30,
  },
  applyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  applySubtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
  },
  applyLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  applyLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#475569',
  },
  applyFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  applyInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  applyTextarea: {
    minHeight: 110,
  },
  applyHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: -10,
    marginBottom: 20,
  },
  applySectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  applySectionDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  applyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
  },
  applyActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 12,
  },
  applyPrimaryButton: {
    backgroundColor: '#2563EB',
  },
  applyDisabledButton: {
    backgroundColor: '#93C5FD',
  },
  applyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  applyCancelButton: {
    backgroundColor: '#E2E8F0',
  },
  applyCancelText: {
    color: '#1E293B',
  },
});
