// screens/RateStudentsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import HeaderBack from '../../components/HeaderBack';

const students = [
  { id: '1', name: 'Aline Mukamana' },
  { id: '2', name: 'Eric Nkurunziza' },
  { id: '3', name: 'Sandrine Uwizeye' },
];

export default function RateStudentsScreen({ route }) {
  const { gigId } = route.params;
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});

  const handleRate = (id, stars) => {
    setRatings({ ...ratings, [id]: stars });
  };

  const handleComment = (id, text) => {
    setComments({ ...comments, [id]: text });
  };

  const handleSubmit = (id) => {
    const rating = ratings[id];
    const comment = comments[id];
    // Connect to backend here
    alert(`Rated ${rating}⭐ for ${id} with comment: ${comment}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Rate Students" backTo="ProviderDashboard" />
        <Text style={styles.header}>Rate Students</Text>

        {students.map((student) => (
          <View key={student.id} style={styles.card}>
            <Text style={styles.name}>{student.name}</Text>

            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRate(student.id, star)}
                >
                  <Text style={ratings[student.id] >= star ? styles.starActive : styles.star}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Leave a comment (optional)"
              value={comments[student.id] || ''}
              onChangeText={(text) => handleComment(student.id, text)}
              multiline
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleSubmit(student.id)}
            >
              <Text style={styles.buttonText}>Submit Rating</Text>
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
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077cc',
    marginBottom: 10,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    fontSize: 24,
    color: '#ccc',
    marginRight: 6,
  },
  starActive: {
    fontSize: 24,
    color: '#f5a623',
    marginRight: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#0077cc',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});