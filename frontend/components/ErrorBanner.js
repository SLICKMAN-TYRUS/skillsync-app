import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="warning-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
      {onClose ? (
        <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel="Dismiss error">
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D32F2F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  message: {
    color: '#fff',
    flex: 1,
    fontWeight: '600',
  },
  close: {
    marginLeft: 8,
    padding: 4,
  },
});
