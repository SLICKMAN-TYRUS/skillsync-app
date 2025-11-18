// screens/ManageGigsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const initialGigs = [
  { id: '1', title: 'Graphic Design for Marketing', status: 'Assigned' },
  { id: '2', title: 'Website Development', status: 'Completed' },
  { id: '3', title: 'Social Media Strategy', status: 'Available' },
];

export default function ManageGigsScreen() {
  const [gigs, setGigs] = useState(initialGigs);

  const updateStatus = (id, newStatus) => {
    const updated = gigs.map((gig) =>
      gig.id === id ? { ...gig, status: newStatus } : gig
    );
    setGigs(updated);
  };

  const deleteGig = (id) => {
    const filtered = gigs.filter((gig) => gig.id !== id);
    setGigs(filtered);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Manage Gigs</Text>

        {gigs.map((gig) => (
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
                  <Picker.Item label="Available" value="Available" />
                  <Picker.Item label="Assigned" value="Assigned" />
                  <Picker.Item label="Completed" value="Completed" />
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