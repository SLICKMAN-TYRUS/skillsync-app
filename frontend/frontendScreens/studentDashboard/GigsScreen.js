// screens/GigsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { useNavigation } from '@react-navigation/native';

const gigs = [
  {
    id: '1',
    title: 'Graphic Design for Marketing',
    category: 'Design',
    date: 'January 28, 2026',
    location: 'Kigali',
    description: 'Create marketing materials for our new campaign.',
    provider: 'Aline Mukamana',
  },
  {
    id: '2',
    title: 'Website Development',
    category: 'Tech',
    date: 'May 8, 2026',
    location: 'Nyanza',
    description: 'Build a responsive website for our startup.',
    provider: 'Eric Nkurunziza',
  },
  {
    id: '3',
    title: 'Social Media Strategy',
    category: 'Marketing',
    date: 'March 15, 2026',
    location: 'Musanze',
    description: 'Develop a content calendar and engagement plan.',
    provider: 'Sandrine Uwizeye',
  },
];

export default function GigsScreen() {
  const navigation = useNavigation();
  const [error, setError] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
  <HeaderBack title="Browse Gigs" backTo="StudentDashboard" />
  <ErrorBanner message={error} onClose={() => setError('')} />
  <View style={styles.header}>
          <Text style={styles.headerTitle}>SkillSync</Text>
        </View>

        {/* Gig Listings */}
        {gigs.map((gig) => (
          <View key={gig.id} style={styles.card}>
            <Text style={styles.title}>{gig.title}</Text>
            <Text style={styles.meta}>Category: {gig.category}</Text>
            <Text style={styles.meta}>Date: {gig.date}</Text>
            <Text style={styles.meta}>Location: {gig.location}</Text>
            <Text style={styles.description}>{gig.description}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                try {
                  navigation.navigate('GigDetailScreen', { gig });
                } catch (err) {
                  console.error('Navigation error', err);
                  setError('Unable to open gig details');
                }
              }}
            >
              <Text style={styles.buttonText}>View / Apply</Text>
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
    backgroundColor: '#0077cc',
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
    borderRadius: 10,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#f2f8ff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});