// screens/ManageGigsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { providerApi } from '../services/api';
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

  const updateStatus = async (id, newStatus) => {
    const prev = gigs.slice();
    setGigs((g) => g.map((gig) => (gig.id === id ? { ...gig, status: newStatus } : gig)));
    try {
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

        {!loading && gigs.map((gig) => (
          <View key={gig.id} style={styles.card}>
            <Text style={styles.title}>{gig.title}</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={gig.status}
                  onValueChange={(value) => updateStatus(gig.id, value)}
                  style={styles.picker}
                >
                  <Picker.Item label="open" value="open" />
                  <Picker.Item label="assigned" value="assigned" />
                  <Picker.Item label="completed" value="completed" />
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
        ))}
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