// screens/ManageGigsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { providerApi } from '../services/api';
import { ensureTestAuth } from '../../services/devAuth';
import { Picker } from '@react-native-picker/picker';

export default function ManageGigsScreen() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
          await ensureTestAuth('firebase-uid-provider1', 'provider');
        }
        const data = await providerApi.getGigs();
        if (!mounted) return;
        // backend may return an array or object
        setGigs(Array.isArray(data) ? data : (data.items || []));
      } catch (err) {
        console.error('Failed to load provider gigs', err);
        setError(err?.message || 'Failed to load gigs');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const allowedStatuses = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Closed', value: 'closed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const updateStatus = async (id, newStatus) => {
    const prev = gigs.slice();
    setGigs((g) => g.map((gig) => (gig.id === id ? { ...gig, status: newStatus } : gig)));
    try {
      if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
        await ensureTestAuth('firebase-uid-provider1', 'provider');
      }
      await providerApi.updateGig(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
      setError(err?.message || 'Failed to update status');
      setGigs(prev);
    }
  };

  const deleteGig = (id) => {
    Alert.alert('Delete gig', 'Are you sure you want to delete this gig?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const prev = gigs.slice();
          setGigs((g) => g.filter((gig) => gig.id !== id));
          try {
            if (((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
              await ensureTestAuth('firebase-uid-provider1', 'provider');
            }
            await providerApi.deleteGig(id);
          } catch (err) {
            console.error('Delete failed', err);
            setError(err?.message || 'Failed to delete gig');
            setGigs(prev);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Manage Gigs</Text>

        {loading && <ActivityIndicator size="large" color="#0077cc" />}
        {!loading && error && <Text style={{ color: '#c53030', textAlign: 'center' }}>{error}</Text>}
        {!loading && gigs.length === 0 && !error ? (
          <Text style={{ textAlign: 'center', color: '#555' }}>You haven't posted any gigs yet.</Text>
        ) : null}

        {!loading && gigs.map((gig) => {
          const isPending = (gig.approval_status || '').toLowerCase() !== 'approved';
          return (
            <View key={gig.id} style={styles.card}>
              <Text style={styles.title}>{gig.title}</Text>

              <Text style={styles.approvalText}>Approval status: {(gig.approval_status || 'pending').toUpperCase()}</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Status:</Text>
                <View style={[styles.pickerContainer, isPending && styles.pickerDisabled]}>
                  <Picker
                    selectedValue={gig.status}
                    onValueChange={(value) => {
                      if (isPending) {
                        Alert.alert('Pending approval', 'You can update the gig status once it has been approved by an administrator.');
                        return;
                      }
                      updateStatus(gig.id, value);
                    }}
                    enabled={!isPending}
                    style={styles.picker}
                  >
                    {allowedStatuses.map((option) => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteGig(gig.id)}
              >
                <Text style={styles.deleteText}>Delete Gig</Text>
              </TouchableOpacity>
            </View>
          );
        })}
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
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f2f8ff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 10,
  },
  approvalText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  pickerContainer: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: Platform.OS === 'android' ? 0 : 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  pickerDisabled: {
    opacity: 0.6,
  },
  picker: {
    height: 40,
    width: '100%',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
  },
});