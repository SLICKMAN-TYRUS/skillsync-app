// screens/CompletedGigsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import { useNavigation } from '@react-navigation/native';

const completedGigs = [
  {
    id: '1',
    title: 'Graphic Design for Marketing',
    provider: 'Aline Mukamana',
    date: 'Oct 28, 2025',
    rated: false,
  },
  {
    id: '2',
    title: 'Website Development',
    provider: 'Eric Nkurunziza',
    date: 'Sep 15, 2025',
    rated: true,
  },
  {
    id: '3',
    title: 'Social Media Strategy',
    provider: 'Sandrine Uwizeye',
    date: 'Aug 30, 2025',
    rated: false,
  },
];

export default function CompletedGigsScreen() {
  const navigation = useNavigation();
  const [error, setError] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
  <HeaderBack title="Completed Gigs" backTo="StudentDashboard" />
  <ErrorBanner message={error} onClose={() => setError('')} />
  <Text style={styles.header}>Completed Gigs</Text>

        {completedGigs.map((gig) => (
          <View key={gig.id} style={styles.card}>
            <Text style={styles.title}>{gig.title}</Text>
            <Text style={styles.meta}>Provider: {gig.provider}</Text>
            <Text style={styles.meta}>Completed: {gig.date}</Text>

            {gig.rated ? (
              <Text style={styles.rated}>✅ Provider Rated</Text>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  navigation.navigate('RateProviderScreen', {
                    providerId: gig.provider,
                    gigTitle: gig.title,
                  })
                }
              >
                <Text style={styles.buttonText}>Rate Provider</Text>
              </TouchableOpacity>
            )}
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
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  rated: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});