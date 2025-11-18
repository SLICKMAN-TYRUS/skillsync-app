// screens/ApplicationConfirmationScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ErrorBanner from '../../components/ErrorBanner';
import HeaderBack from '../../components/HeaderBack';

export default function ApplicationConfirmationScreen({ route }) {
  const { gigTitle } = route.params;
  const [error, setError] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Application Submitted" backTo="StudentDashboard" />
        <ErrorBanner message={error} onClose={() => setError('')} />
        <Text style={styles.message}>You have successfully applied for:</Text>
        <Text style={styles.gigTitle}>{gigTitle}</Text>
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
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  gigTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077cc',
    textAlign: 'center',
  },
});