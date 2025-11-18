// screens/GigDetailScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { studentApi } from '../../services/api';
import api from '../../services/api';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';

export default function GigDetailScreen({ route }) {
  const { gig } = route.params;
  const navigation = useNavigation();
  const [error, setError] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
  <HeaderBack title="Gig Details" backTo="GigsScreen" />
  <ErrorBanner message={error} onClose={() => setError('')} />
  <Text style={styles.title}>{gig.title}</Text>
        <Text style={styles.meta}>Category: {gig.category}</Text>
        <Text style={styles.meta}>Date: {gig.date}</Text>
        <Text style={styles.meta}>Location: {gig.location}</Text>
        <Text style={styles.description}>{gig.description}</Text>

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
              let resumeUrl = null;
              try {
                const resp = await studentApi.getProfile();
                resumeUrl = resp.data?.resumeUrl;
              } catch (err) {
                // fallback
                const r = await api.get('/student/profile');
                resumeUrl = r.data?.resumeUrl;
              }

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
                        await studentApi.applyToGig(gig.id, { resumeUrl });
                        Alert.alert('Applied', 'Your application has been submitted');
                        navigation.navigate('ApplicationConfirmationScreen', { gigId: gig.id, gigTitle: gig.title });
                      } catch (err) {
                        console.error('Apply failed', err);
                        setError(err?.response?.data?.message || err?.message || 'Failed to apply');
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