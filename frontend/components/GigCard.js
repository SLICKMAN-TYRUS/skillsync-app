import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import RoleBadge from './RoleBadge';
import RatingStars from './RatingStars';

const GigCard = ({ gig, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(gig)}>
      <View style={styles.header}>
        <Text style={styles.title}>{gig.title}</Text>
        <RoleBadge role={gig.category} />
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {gig.description}
      </Text>
      
      <View style={styles.details}>
        <View style={styles.providerInfo}>
          {gig.providerImage ? (
            <Image source={{ uri: gig.providerImage }} style={styles.providerImage} />
          ) : (
            <View style={[styles.providerImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>
                {gig.providerName?.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.providerName}>{gig.providerName}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          <RatingStars rating={gig.rating} size={16} />
          <Text style={styles.ratingCount}>({gig.ratingCount})</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.price}>${gig.price}</Text>
        <Text style={styles.duration}>{gig.duration}</Text>
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
