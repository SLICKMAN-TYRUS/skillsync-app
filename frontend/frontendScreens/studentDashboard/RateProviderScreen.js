// screens/RateProviderScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBack from '../../components/HeaderBack';
import RatingStars from '../../components/RatingStars';
import { ratingApi } from '../../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import { pushToast } from '../../services/toastStore';

const BRAND_COLORS = {
  primary: '#2B75F6',
  accent: '#FFD166',
  slate: '#0F172A',
  subtle: '#F5F7FB',
  dangerBorder: '#FCA5A5',
  dangerFill: '#FEE2E2',
  dangerText: '#7F1D1D',
};

const FEEDBACK_PROMPTS = [
  {
    label: 'Impact',
    detail: 'Call out how the provider helped your gig succeed or pushed it forward.',
    icon: 'sparkles-outline',
  },
  {
    label: 'Reliability',
    detail: 'Share how responsive they were and if deadlines were met.',
    icon: 'shield-checkmark-outline',
  },
  {
    label: 'Next Time',
    detail: 'Suggest one tweak for an even stronger collaboration next time.',
    icon: 'chatbubble-ellipses-outline',
  },
];

const CHARACTER_LIMIT = 240;

const getInitials = (name = '') => {
  const segments = name.trim().split(' ');
  if (segments.length === 0) {
    return '?';
  }
  const [first, second] = segments;
  if (!second) {
    return first.charAt(0).toUpperCase();
  }
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
};

const getDisplayName = (entry) =>
  entry?.counterparty?.full_name ||
  entry?.counterparty?.display_name ||
  entry?.counterparty?.name ||
  entry?.counterparty?.email ||
  'Collaborator';

const getCounterpartyRole = (entry) =>
  entry?.counterparty?.relationship_label ||
  entry?.counterparty?.role ||
  entry?.counterparty?.type ||
  '';

const getGigTitle = (entry) => entry?.gig?.title || entry?.gig?.name || entry?.gig?.display_name || 'Untitled gig';

export default function RateProviderScreen() {
  const [rateables, setRateables] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const getEntryKey = useCallback((entry) => `${entry?.gig?.id}:${entry?.counterparty?.id}`, []);

  const hydrateDefaults = useCallback(
    (data) => {
      setRatings((prev) => {
        const next = {};
        data.forEach((entry) => {
          const key = getEntryKey(entry);
          const existingScore = entry.existing_rating?.score ?? 0;
          next[key] = prev[key] ?? existingScore;
        });
        return next;
      });
      setComments((prev) => {
        const next = {};
        data.forEach((entry) => {
          const key = getEntryKey(entry);
          const existingComment = entry.existing_rating?.comment ?? '';
          next[key] = prev[key] ?? existingComment;
        });
        return next;
      });
    },
    [getEntryKey],
  );

  const loadRateables = useCallback(async () => {
    try {
      setLoading(true);
      if ((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true') {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }
      const response = await ratingApi.getRateable();
      const payload = Array.isArray(response?.data) ? response.data : response;
      setRateables(payload || []);
      hydrateDefaults(payload || []);
      setError('');
    } catch (err) {
      console.warn('Failed to load rateable collaborators', err);
      setError('Unable to load collaborators ready for rating. Pull to refresh or try again.');
    } finally {
      setLoading(false);
    }
  }, [hydrateDefaults]);

  useEffect(() => {
    loadRateables();
  }, [loadRateables]);

  const completedCount = useMemo(() => {
    return rateables.reduce((total, entry) => {
      const key = getEntryKey(entry);
      const hasRating = ratings[key] && ratings[key] > 0;
      return total + (entry.already_rated || hasRating ? 1 : 0);
    }, 0);
  }, [rateables, ratings, getEntryKey]);

  const remainingCount = Math.max(rateables.length - completedCount, 0);
  const progressPercent = rateables.length
    ? Math.round((completedCount / rateables.length) * 100)
    : 0;

  const handleRate = (key, stars) => {
    setRatings((prev) => ({ ...prev, [key]: stars }));
  };

  const handleComment = (key, text) => {
    const nextValue = text.slice(0, CHARACTER_LIMIT);
    setComments((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleSubmit = async (entry) => {
    const key = getEntryKey(entry);
    const score = ratings[key];
    const comment = comments[key] || '';

    if (!score || score < 1) {
      setError('Pick a rating before submitting.');
      return;
    }

    try {
      setError('');
      setSubmitting((prev) => ({ ...prev, [key]: true }));
      const payload = {
        ratee_id: entry.counterparty?.id,
        gig_id: entry.gig?.id,
        score,
        comment,
      };
      const response = await ratingApi.create(payload);
      const saved = response?.data || response;
      setRateables((prev) =>
        prev.map((item) =>
          getEntryKey(item) === key
            ? {
                ...item,
                already_rated: true,
                existing_rating: saved,
              }
            : item,
        ),
      );
      setRatings((prev) => ({ ...prev, [key]: saved?.score ?? score }));
      setComments((prev) => ({ ...prev, [key]: saved?.comment ?? comment }));
      pushToast({ type: 'success', message: 'Rating submitted.' });
    } catch (err) {
      console.error('Rating submission failed', err);
      setError('Failed to submit rating. Please try again later.');
    } finally {
      setSubmitting((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND_COLORS.subtle} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <HeaderBack title="Rate Providers" backTo="StudentDashboard" />

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Provider feedback</Text>
          <Text style={styles.heroTitle}>Celebrate the collaborators who powered your gigs</Text>
          <Text style={styles.heroCopy}>
            Highlight the wins, document reliability, and help the next SkillSync student choose the right partner.
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>Ratings captured</Text>
              <Text style={styles.heroStatValue}>
                {completedCount}/{rateables.length}
              </Text>
              <Text style={styles.heroStatHint}>
                {rateables.length === 0
                  ? 'No collaborators waiting right now.'
                  : remainingCount
                    ? `${remainingCount} more to finish this batch`
                    : 'All providers reviewed — nice!'}
              </Text>
            </View>

            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>Progress</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.heroStatHint}>{progressPercent}% complete</Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.inlineError}>
            <Ionicons name="alert-circle-outline" size={18} color={BRAND_COLORS.dangerText} style={styles.inlineErrorIcon} />
            <Text style={styles.inlineErrorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError('')} style={styles.inlineErrorClose} accessibilityRole="button">
              <Ionicons name="close" size={16} color={BRAND_COLORS.dangerText} />
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
            <Text style={styles.loadingText}>Pulling in your collaborators…</Text>
          </View>
        ) : rateables.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="checkmark-done-circle-outline" size={30} color={BRAND_COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyCopy}>
              No one is waiting on feedback right now. We'll notify you when a collaborator closes their gig with you.
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadRateables} accessibilityRole="button">
              <Ionicons name="refresh" size={16} color={BRAND_COLORS.primary} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rateables.map((entry) => {
            const key = getEntryKey(entry);
            const rating = ratings[key] || 0;
            const comment = comments[key] || '';
            const remaining = CHARACTER_LIMIT - comment.length;
            const isLocked = entry.already_rated && !!entry.existing_rating;
            const isBusy = submitting[key];
            const displayName = getDisplayName(entry);
            const role = getCounterpartyRole(entry);
            const gigTitle = getGigTitle(entry);

            return (
              <View key={key} style={[styles.providerCard, isLocked && styles.providerCardLocked]}>
                <View style={styles.providerHeader}>
                  <View style={styles.avatarRing}>
                    <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                  </View>
                  <View style={styles.providerMeta}>
                    <Text style={styles.providerName}>{displayName}</Text>
                    {role ? <Text style={styles.providerRole}>{role}</Text> : null}
                    <View style={styles.gigBadge}>
                      <Ionicons name="briefcase-outline" size={14} color={BRAND_COLORS.primary} />
                      <Text style={styles.gigBadgeText}>{gigTitle}</Text>
                    </View>
                  </View>
                  {isLocked ? (
                    <View style={[styles.pill, styles.pillSuccess]}>
                      <Ionicons name="checkmark" size={14} color={BRAND_COLORS.primary} />
                      <Text style={styles.pillText}>Submitted</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.ratingRow}>
                  <RatingStars
                    rating={rating}
                    color={BRAND_COLORS.accent}
                    size={26}
                    onRatingChange={isLocked ? undefined : (value) => handleRate(key, value)}
                  />
                  <Text style={styles.ratingHint}>
                    {isLocked
                      ? `Scored ${entry?.existing_rating?.score ?? rating} star${rating === 1 ? '' : 's'}`
                      : rating
                        ? `You chose ${rating} star${rating === 1 ? '' : 's'}`
                        : 'Tap the stars to score this collaboration'}
                  </Text>
                </View>

                <View style={styles.commentBlock}>
                  <TextInput
                    style={[styles.commentInput, isLocked && styles.commentInputDisabled]}
                    placeholder="Share specifics: what stood out, what to repeat, or one tweak for next time."
                    value={comment}
                    onChangeText={(text) => {
                      if (!isLocked) {
                        handleComment(key, text);
                      }
                    }}
                    editable={!isLocked}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <View style={styles.commentFooter}>
                    <Text style={styles.commentCounter}>
                      {isLocked ? 'Already submitted' : `${remaining} characters left`}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        (!rating || isLocked || isBusy) && styles.submitButtonDisabled,
                      ]}
                      onPress={() => handleSubmit(entry)}
                      disabled={!rating || isLocked || isBusy}
                      accessibilityRole="button"
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitButtonText}>{isLocked ? 'Submitted' : 'Submit rating'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Feedback prompts</Text>

          {FEEDBACK_PROMPTS.map((prompt) => (
            <View key={prompt.label} style={styles.promptRow}>
              <Ionicons name={prompt.icon} size={18} color={BRAND_COLORS.primary} style={styles.promptIcon} />
              <View style={styles.promptCopy}>
                <Text style={styles.promptLabel}>{prompt.label}</Text>
                <Text style={styles.promptDetail}>{prompt.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.subtle,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 24,
    padding: 24,
    marginTop: 12,
    marginBottom: 28,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 10,
  },
  heroCopy: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 20,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 22,
    marginHorizontal: -6,
  },
  heroStatCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
  },
  heroStatHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 10,
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_COLORS.accent,
    borderRadius: 6,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.dangerFill,
    borderColor: BRAND_COLORS.dangerBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  inlineErrorIcon: {
    marginRight: 10,
  },
  inlineErrorText: {
    flex: 1,
    color: BRAND_COLORS.dangerText,
    fontWeight: '600',
    fontSize: 13,
  },
  inlineErrorClose: {
    padding: 6,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 22,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    backgroundColor: 'rgba(43,117,246,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: BRAND_COLORS.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  providerMeta: {
    marginLeft: 14,
    flex: 1,
  },
  providerRole: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  providerName: {
    color: BRAND_COLORS.slate,
    fontSize: 16,
    fontWeight: '700',
  },
  gigBadge: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: BRAND_COLORS.subtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  gigBadgeText: {
    marginLeft: 6,
    color: BRAND_COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 18,
  },
  ratingHint: {
    marginLeft: 12,
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  commentBlock: {
    marginTop: 18,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D0D8EC',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 110,
    fontSize: 14,
    color: BRAND_COLORS.slate,
    backgroundColor: '#FFFFFF',
  },
  commentFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentCounter: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  providerCardLocked: {
    borderColor: '#CBD5F5',
    borderWidth: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43,117,246,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillSuccess: {
    backgroundColor: 'rgba(43,117,246,0.14)',
  },
  pillText: {
    marginLeft: 4,
    color: BRAND_COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  commentInputDisabled: {
    backgroundColor: '#F8FAFF',
    borderStyle: 'dashed',
  },
  loadingBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 12,
    color: BRAND_COLORS.slate,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND_COLORS.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    color: BRAND_COLORS.slate,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyCopy: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  refreshButtonText: {
    marginLeft: 6,
    color: BRAND_COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginBottom: 36,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  tipsTitle: {
    color: BRAND_COLORS.slate,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  promptIcon: {
    marginTop: 2,
  },
  promptCopy: {
    marginLeft: 12,
    flex: 1,
  },
  promptLabel: {
    color: BRAND_COLORS.slate,
    fontSize: 13,
    fontWeight: '700',
  },
  promptDetail: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});