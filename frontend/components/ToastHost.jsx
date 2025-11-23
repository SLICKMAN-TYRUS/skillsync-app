import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useToastQueue, dismissToast } from '../services/toastStore';

const TYPE_COLORS = {
  success: '#0f9d58',
  error: '#d93025',
  info: '#4285f4',
  warning: '#fbbc05',
};

export default function ToastHost() {
  const toasts = useToastQueue();

  if (!toasts.length) return null;

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {toasts.map((toast) => (
        <View
          key={toast.id}
          style={[styles.toast, { backgroundColor: TYPE_COLORS[toast.type] || TYPE_COLORS.info }]}
          onTouchEnd={() => dismissToast(toast.id)}
        >
          <Text style={styles.text}>{toast.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 32 : 64,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});