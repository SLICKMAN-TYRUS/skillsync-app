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
    location: '',
    deadline: '',
  });

  const [submitting, setSubmitting] = useState(false);

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
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (formData.deadline.trim()) {
      const deadlinePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!deadlinePattern.test(formData.deadline.trim())) {
        newErrors.deadline = 'Deadline must be YYYY-MM-DD';
      }
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
      setSubmitting(true);
      const skills = formData.skillsRequired
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean);

      const sections = [formData.description.trim()];
      if (formData.requirements.trim()) {
        sections.push(`Requirements:\n${formData.requirements.trim()}`);
      }
      if (skills.length) {
        sections.push(`Preferred skills: ${skills.join(', ')}`);
      }
      if (formData.duration.trim()) {
        sections.push(`Estimated duration: ${formData.duration.trim()}`);
      }

      const payload = {
        title: formData.title.trim(),
        description: sections.filter(Boolean).join('\n\n'),
        category: formData.category.trim(),
        budget: parseFloat(formData.price),
        location: formData.location.trim(),
        deadline: formData.deadline.trim() || null,
      };

      await api.post('/gigs', payload);

      Alert.alert(
        'Success',
        'Your gig has been submitted for admin review. You will be notified once it is approved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ProviderDashboard'),
          },
        ],
      );

      setFormData({
        title: '',
        description: '',
        category: '',
        price: '',
        duration: '',
        requirements: '',
        skillsRequired: '',
        location: '',
        deadline: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to post gig. Please try again.');
    } finally {
      setSubmitting(false);
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

        <FormField
          label="Location"
          placeholder="Where will the work take place?"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
          error={errors.location}
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

        <FormField
          label="Deadline"
          placeholder="YYYY-MM-DD"
          value={formData.deadline}
          onChangeText={(text) => setFormData({ ...formData, deadline: text })}
          error={errors.deadline}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Icon name="check" size={24} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Gig'}</Text>
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PostGigScreen;
