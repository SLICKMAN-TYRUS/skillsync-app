import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { api } from '../../services/api';
import HeaderBack from '../../components/HeaderBack';

const PostGigScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    requirements: '',
    skillsRequired: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price)) {
      newErrors.price = 'Price must be a number';
    }
    if (!formData.duration.trim()) {
      newErrors.duration = 'Duration is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }

    try {
      const response = await api.post('/gigs', {
        ...formData,
        price: parseFloat(formData.price),
        skillsRequired: formData.skillsRequired
          .split(',')
          .map(skill => skill.trim())
          .filter(Boolean),
      });

      Alert.alert(
        'Success',
        'Your gig has been submitted for approval',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to post gig. Please try again.');
    }
  };

  const FormField = ({ label, error, ...props }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#999999"
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
      >
        <HeaderBack title="Post a Gig" backTo="ProviderDashboard" />
        <View style={styles.header}>
          <Text style={styles.title}>Post a New Gig</Text>
          <Text style={styles.subtitle}>
            Fill in the details of your gig to get started
          </Text>
        </View>

        <FormField
          label="Title"
          placeholder="Enter gig title"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          error={errors.title}
        />

        <FormField
          label="Description"
          placeholder="Describe your gig in detail"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          error={errors.description}
        />

        <FormField
          label="Category"
          placeholder="Select category (e.g., Tutor, Mentor)"
          value={formData.category}
          onChangeText={(text) => setFormData({ ...formData, category: text })}
          error={errors.category}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormField
              label="Price ($)"
              placeholder="0.00"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="decimal-pad"
              error={errors.price}
            />
          </View>

          <View style={styles.halfField}>
            <FormField
              label="Duration"
              placeholder="e.g., 2 hours, 1 week"
              value={formData.duration}
              onChangeText={(text) => setFormData({ ...formData, duration: text })}
              error={errors.duration}
            />
          </View>
        </View>

        <FormField
          label="Requirements"
          placeholder="List any prerequisites or requirements"
          value={formData.requirements}
          onChangeText={(text) => setFormData({ ...formData, requirements: text })}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <FormField
          label="Skills Required"
          placeholder="Enter skills (comma-separated)"
          value={formData.skillsRequired}
          onChangeText={(text) => setFormData({ ...formData, skillsRequired: text })}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Icon name="check" size={24} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Submit Gig</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333333',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    width: '48%',
  },
  submitButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PostGigScreen;
