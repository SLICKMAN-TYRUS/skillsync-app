// screens/ReviewApplicationsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import HeaderBack from '../../components/HeaderBack';

const applicants = [
  { id: '1', name: 'Aline Mukamana', message: 'I’m excited to contribute to your campaign.' },
  { id: '2', name: 'Eric Nkurunziza', message: 'Experienced in web development and ready to deliver.' },
  { id: '3', name: 'Sandrine Uwizeye', message: 'Skilled in social media strategy and content planning.' },
];

export default function ReviewApplicationsScreen({ route }) {
  const { gigId } = route.params;
  const [decisions, setDecisions] = useState({});

  const handleDecision = (id, status) => {
    setDecisions({ ...decisions, [id]: status });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Review Applications" backTo="ProviderDashboard" />
        <Text style={styles.header}>Review Applications</Text>

        {applicants.map((applicant) => (
          <View key={applicant.id} style={styles.card}>
            <Text style={styles.name}>{applicant.name}</Text>
            <Text style={styles.message}>{applicant.message}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.button,
                  decisions[applicant.id] === 'Accepted' && styles.accepted,
                ]}
                onPress={() => handleDecision(applicant.id, 'Accepted')}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  decisions[applicant.id] === 'Rejected' && styles.rejected,
                ]}
                onPress={() => handleDecision(applicant.id, 'Rejected')}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>

            {decisions[applicant.id] && (
              <Text style={styles.status}>Status: {decisions[applicant.id]}</Text>
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
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  accepted: {
    backgroundColor: '#28a745',
  },
  rejected: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  status: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
});