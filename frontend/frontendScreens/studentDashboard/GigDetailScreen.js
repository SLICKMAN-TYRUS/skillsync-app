// screens/GigDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';
import { fetchGigById, applyToGig, fetchCurrentProfile } from '../services/api';

export default function GigDetailScreen({ route }) {
  const { gig } = route.params;
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullGig, setFullGig] = useState(g || null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!gig?.id) return;
      setLoading(true);
      try {
        const data = await fetchGigById(gig.id);
        if (mounted) setFullGig(data);
      } catch (err) {
        console.error('Failed to fetch gig details', err);
        setError(err?.message || 'Failed to load gig details');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [gig]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
  <HeaderBack title="Gig Details" backTo="GigsScreen" />
  <ErrorBanner message={error} onClose={() => setError('')} />
        {loading ? (
          <ActivityIndicator size="large" color="#0077cc" />
        ) : (
          <>
            <Text style={styles.title}>{fullGig?.title || gig.title}</Text>
            <Text style={styles.meta}>Category: {fullGig?.category || gig.category}</Text>
            <Text style={styles.meta}>Deadline: {fullGig?.deadline || gig.date}</Text>
            <Text style={styles.meta}>Location: {fullGig?.location || gig.location}</Text>
            <Text style={styles.description}>{fullGig?.description || gig.description}</Text>
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ChatScreen', { sender: gig.provider })}
        >
          <Text style={styles.buttonText}>Message Provider</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#28a745', marginTop: 12 }]}
          onPress={async () => {
            try {
              // fetch student profile to check for resume
              const profile = await fetchCurrentProfile();
              const resumeUrl = profile?.resumeUrl;

              if (!resumeUrl) {
                setError('Please upload your resume in your profile before applying.');
                return;
              }

              Alert.alert(
                'Confirm Application',
                'Submit your application for this gig?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Apply',
                    onPress: async () => {
                      try {
                        await applyToGig(gig.id);
                        Alert.alert('Applied', 'Your application has been submitted');
                        navigation.navigate('ApplicationConfirmationScreen', { gigId: gig.id, gigTitle: gig.title });
                      } catch (err) {
                        console.error('Apply failed', err);
                        setError(err?.message || err?.response?.data?.message || 'Failed to apply');
                      }
                    },
                  },
                ],
              );
            } catch (err) {
              console.error('Apply flow failed', err);
              setError('Something went wrong — please try again');
            }
          }}
        >
          <Text style={styles.buttonText}>Apply to Gig</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 10,
    textAlign: 'center',
  },
  meta: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#444',
    marginVertical: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});