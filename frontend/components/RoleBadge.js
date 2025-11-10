import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RoleBadge = ({ role }) => {
  const getBadgeColor = () => {
    switch (role.toLowerCase()) {
      case 'tutor':
        return '#4CAF50'; // Green
      case 'mentor':
        return '#2196F3'; // Blue
      case 'assistant':
        return '#9C27B0'; // Purple
      case 'researcher':
        return '#FF9800'; // Orange
      default:
        return '#757575'; // Grey
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
      <Text style={styles.text}>{role}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default RoleBadge;
