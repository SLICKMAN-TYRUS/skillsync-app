import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import RoleBadge from './RoleBadge';
import RatingStars from './RatingStars';

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Not specified';
  const numeric = Number(value);
  const formatted = numeric % 1 === 0 ? numeric.toFixed(0) : numeric.toFixed(2);
  return currency ? `${currency} ${formatted}` : formatted;
};

const formatDuration = (gig) => {
  if (gig.duration) return gig.duration;
  if (gig.duration_label) return gig.duration_label;
  if (gig.deadline_display) return gig.deadline_display;
  if (gig.deadline) {
    const date = new Date(gig.deadline);
    if (!Number.isNaN(date.getTime())) return date.toDateString();
  }
  return 'Flexible timeline';
};

const GigCard = ({ gig, onPress }) => {
  const providerName = gig.providerName || gig.provider_name || gig.provider?.name || 'Anonymous Provider';
  const providerImage = gig.providerImage || gig.provider_profile_photo || gig.provider?.profile_photo;
  const ratingValue = gig.rating ?? gig.rating_average ?? gig.provider_average_rating ?? gig.provider?.average_rating ?? 0;
  const ratingCount = gig.ratingCount ?? gig.rating_count ?? 0;
  const price = gig.price ?? gig.budget;
  const currency = gig.currency || gig.priceCurrency || gig.budget_currency || '';

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(gig)}>
      <View style={styles.header}>
        <Text style={styles.title}>{gig.title}</Text>
        <RoleBadge role={gig.category} />
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {gig.description}
      </Text>
      
      <View style={styles.details}>
        <View style={styles.providerInfo}>
          {providerImage ? (
            <Image source={{ uri: providerImage }} style={styles.providerImage} />
          ) : (
            <View style={[styles.providerImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>
                {providerName?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.providerName}>{providerName}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          <RatingStars rating={Number(ratingValue) || 0} size={16} />
          <Text style={styles.ratingCount}>({ratingCount})</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.price}>Budget: {formatCurrency(price, currency)}</Text>
        <Text style={styles.duration}>{formatDuration(gig)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  placeholderImage: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666666',
  },
  providerName: {
    fontSize: 14,
    color: '#333333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingCount: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  duration: {
    fontSize: 14,
    color: '#666666',
  },
});

export default GigCard;
