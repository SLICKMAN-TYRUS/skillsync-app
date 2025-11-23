// screens/PostGigScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  TouchableWithoutFeedback,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import apiClient, { fetchLocations, providerApi } from '../../services/api';
import { ensureTestAuth, isTestAuthEnabled } from '../../services/devAuth';
import HeaderBack from '../../components/HeaderBack';
import { pushToast } from '../../services/toastStore';
import { getSharedEventStream } from '../../services/eventStream';

const CATEGORIES = [
  { label: 'Design & Creative', value: 'Design & Creative' },
  { label: 'Software Development', value: 'Software Development' },
  { label: 'Data & Analytics', value: 'Data & Analytics' },
  { label: 'Marketing & Growth', value: 'Marketing & Growth' },
  { label: 'Content & Copywriting', value: 'Content & Copywriting' },
  { label: 'Operations & Logistics', value: 'Operations & Logistics' },
  { label: 'Finance & Accounting', value: 'Finance & Accounting' },
  { label: 'Community & Events', value: 'Community & Events' },
  { label: 'Research & Strategy', value: 'Research & Strategy' },
  { label: 'Customer Support', value: 'Customer Support' },
];

export default function PostGigScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineDisplay, setDeadlineDisplay] = useState('');
  const [locations, setLocations] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [day, setDay] = useState(new Date().getDate());
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('FRW');
  const [formFeedback, setFormFeedback] = useState(null);

  const shouldUseDevTokens = async () => {
    if (!((typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true')) {
      return false;
    }
    return isTestAuthEnabled();
  };

  const handleTitleChange = (text) => {
    setTitle(text);
    clearError('title');
  };

  const handleDescriptionChange = (text) => {
    setDescription(text);
    clearError('description');
  };

  const handleRequirementsChange = (text) => {
    setRequirements(text);
  };

  const handleSkillsChange = (text) => {
    setSkillsRequired(text);
  };

  const handleDurationChange = (text) => {
    setDuration(text);
    clearError('duration');
  };

  const handleBudgetChange = (text) => {
    setPrice(text);
    clearError('price');
  };

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (formFeedback?.type === 'error') {
      setFormFeedback(null);
    }
  };

  const getEventText = (event) => {
    if (event?.nativeEvent && typeof event.nativeEvent.text === 'string') {
      return event.nativeEvent.text;
    }
    if (event?.target && typeof event.target.value === 'string') {
      return event.target.value;
    }
    return '';
  };

  const handleAddAttachmentField = () => {
    setAttachments((prev) => [...prev, '']);
    clearError('attachments');
  };

  const handleAttachmentChange = (index, value) => {
    const trimmed = value.trim();
    setAttachments((prev) => prev.map((item, idx) => (idx === index ? value : item)));
    if (!trimmed || isValidUrl(trimmed)) {
      clearError('attachments');
    }
    if (formFeedback?.type === 'error') {
      setFormFeedback(null);
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
    clearError('attachments');
    if (formFeedback?.type === 'error') {
      setFormFeedback(null);
    }
  };

  const openAttachmentLink = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open link', 'Please make sure the attachment URL is correct.');
    });
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(png|jpg|jpeg|gif|webp|heic)(\?.*)?$/i.test(url);
  };

  const isValidUrl = (value) => {
    if (!value) return false;
    try {
      const parsed = new URL(value);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch (err) {
      return false;
    }
  };

  const pickAndUpload = async () => {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: Platform.OS !== 'web',
        multiple: false,
        type: '*/*',
      });

      if (!pickerResult || pickerResult.type === 'cancel' || pickerResult.canceled) {
        return;
      }

      const asset = Array.isArray(pickerResult.assets) ? pickerResult.assets[0] : pickerResult;
      if (!asset) {
        throw new Error('No file information returned by the picker.');
      }

      const fileUri = asset.uri;
      if (!fileUri && Platform.OS !== 'web') {
        throw new Error('Unable to locate the selected file.');
      }

      const fileName = (asset.name || (fileUri ? fileUri.split('/').pop() : '') || `upload-${Date.now()}`).trim();
      const mimeType = asset.mimeType || asset.type || asset.file?.type || 'application/octet-stream';

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const FileCtor = typeof File !== 'undefined' ? File : null;
        let fileObject = asset.file;

        if (!fileObject && fileUri) {
          const response = await fetch(fileUri);
          const blob = await response.blob();
          if (FileCtor && blob instanceof FileCtor) {
            fileObject = blob;
          } else if (FileCtor) {
            fileObject = new FileCtor([blob], fileName, { type: mimeType });
          } else {
            fileObject = blob;
          }
        }

        if (!fileObject) {
          throw new Error('Unable to access the selected file contents.');
        }

        if (FileCtor && !(fileObject instanceof FileCtor)) {
          fileObject = new FileCtor([fileObject], fileName, { type: mimeType });
        } else if (FileCtor && fileObject instanceof FileCtor && !fileObject.name) {
          fileObject = new FileCtor([fileObject], fileName, { type: fileObject.type || mimeType });
        }

        formData.append('file', fileObject, fileName);
      } else {
        formData.append('file', {
          uri: fileUri,
          name: fileName,
          type: mimeType,
        });
      }

      const uploadResponse = await apiClient.post('/uploads', formData);

      const { url: uploadedUrl, path: uploadedPath } = uploadResponse?.data || {};
      const normalizedUrl = uploadedUrl
        || (uploadedPath ? new URL(uploadedPath, apiClient.defaults.baseURL || '').toString() : null);

      if (!normalizedUrl) {
        throw new Error('Upload did not return a usable file URL.');
      }

      setAttachments((prev) => [...prev, normalizedUrl]);
      clearError('attachments');
      pushToast({ type: 'success', message: `${fileName} uploaded.` });
    } catch (err) {
      console.warn('Document picker/upload failed', err);
      Alert.alert('Upload failed', err?.message || String(err));
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (await shouldUseDevTokens()) {
          await ensureTestAuth('firebase-uid-provider1', 'provider');
        }
        const locs = await fetchLocations();
        if (!mounted) return;
        const fallback = [
          'Kigali City',
          'Nyarugenge',
          'Kicukiro',
          'Gasabo',
          'Kimironko',
          'Gisozi',
          'Nyamirambo',
          'Kacyiru',
          'Remera',
          'Kagarama',
          'Online',
          'Other',
        ];
        const normalized = (locs && Array.isArray(locs) ? locs.map((l) => (l && l.name ? l.name : l)) : []);
        const merged = Array.from(new Set([...normalized.filter(Boolean), ...fallback]));
        setLocations(merged);
      } catch (e) {
        console.warn('Failed to load locations', e);
        const fallback = [
          'Kigali City',
          'Nyarugenge',
          'Kicukiro',
          'Gasabo',
          'Kimironko',
          'Gisozi',
          'Nyamirambo',
          'Kacyiru',
          'Remera',
          'Kagarama',
          'Online',
          'Other',
        ];
        if (mounted) {
          setLocations(fallback);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const client = getSharedEventStream();
    if (!client) {
      return undefined;
    }

    const offApproved = client.on('gig_approved', (payload = {}) => {
      const title = payload?.title || 'Your gig';
      pushToast({ type: 'success', message: `Gig "${title}" approved!` });
    });

    const offRejected = client.on('gig_rejected', (payload = {}) => {
      const title = payload?.title || 'Your gig';
      const reason = payload?.reason ? ` Reason: ${payload.reason}` : '';
      pushToast({ type: 'error', message: `Gig "${title}" was rejected.${reason}` });
    });

    return () => {
      offApproved();
      offRejected();
    };
  }, []);

  const applyDate = () => {
    const d = new Date(year, month, day);
    setDeadline(d.toISOString().split('T')[0]);
    setDeadlineDisplay(d.toDateString());
    clearError('deadline');
    setShowDatePicker(false);
  };

  const validateForm = () => {
    const validationErrors = {};
    if (!title.trim()) validationErrors.title = 'Title is required';
    if (!description.trim()) validationErrors.description = 'Description is required';
    if (!category) validationErrors.category = 'Category is required';
    if (!location) validationErrors.location = 'Location is required';
    if (!deadline) validationErrors.deadline = 'Date is required';

    const numericBudget = Number(price);
    if (!price.trim() || Number.isNaN(numericBudget) || numericBudget <= 0) {
      validationErrors.price = 'Enter a valid budget amount';
    }

    if (!duration.trim()) validationErrors.duration = 'Duration is required';

    const trimmedAttachments = attachments.map((item) => item.trim()).filter(Boolean);
    const invalidAttachment = trimmedAttachments.find((link) => !isValidUrl(link));
    if (invalidAttachment) {
      validationErrors.attachments = 'Attachments must be valid URLs beginning with http or https.';
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setFormFeedback({ type: 'error', message: 'Please complete the highlighted required fields before sharing.' });
      return { isValid: false, trimmedAttachments };
    }

    setFormFeedback(null);
    return { isValid: true, trimmedAttachments };
  };

  const confirmShare = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const confirmed = window.confirm('Ready to send this gig to admins for review? You can still edit it later.');
      return Promise.resolve(confirmed);
    }

    return new Promise((resolve) => {
      Alert.alert(
        'Share for Review',
        'Ready to send this gig to admins for review? You can still edit it later.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Post', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  };

  const handlePostGig = async () => {
    if (loading) return;

    const { isValid, trimmedAttachments } = validateForm();
    if (!isValid) {
      return;
    }

    const shouldSubmit = await confirmShare();
    if (!shouldSubmit) {
      return;
    }

    setLoading(true);
    try {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      const trimmedRequirements = requirements.trim();
      const trimmedSkills = skillsRequired.trim();
      const trimmedDuration = duration.trim();

      const parts = [trimmedDescription];
      if (trimmedRequirements) {
        parts.push(`Requirements:\n${trimmedRequirements}`);
      }
      if (trimmedSkills) {
        parts.push(`Highlighted skills:\n${trimmedSkills}`);
      }
      parts.push(`Estimated duration: ${trimmedDuration}`);
      const composedDescription = parts.filter(Boolean).join('\n\n');

      const payload = {
        title: trimmedTitle,
        category,
        location,
        deadline,
        description: composedDescription,
        budget: Number(price),
        duration: trimmedDuration,
        attachments: trimmedAttachments,
        currency,
        requirements: trimmedRequirements || null,
        skills_highlight: trimmedSkills || null,
      };
      if (await shouldUseDevTokens()) {
        await ensureTestAuth('firebase-uid-provider1', 'provider');
      }
      if (providerApi && providerApi.createGig) {
        await providerApi.createGig(payload);
      } else {
        await apiClient.post('/gigs', payload);
      }
      pushToast({ type: 'success', message: `Gig "${trimmedTitle}" submitted for review.` });
      Alert.alert('Success', 'Gig shared with admins. You will be notified once it is reviewed.');
      setTitle('');
      setCategory('');
      setLocation('');
      setDeadline('');
      setDeadlineDisplay('');
      setDescription('');
      setRequirements('');
      setSkillsRequired('');
      setPrice('');
      setDuration('');
      setAttachments([]);
      setFormFeedback(null);
      setErrors({});
      navigation.goBack();
    } catch (err) {
      console.error('Post gig failed', err);
      setFormFeedback({ type: 'error', message: err?.response?.data?.message || err.message || 'Failed to share gig. Please try again.' });
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to post gig');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = CATEGORIES;
  const locationOptions = locations.map((entry) => {
    const label = typeof entry === 'string' ? entry : entry?.name || entry?.label || `${entry}`;
    const value = typeof entry === 'string' ? entry : entry?.id || entry?.name || entry?.value || label;
    return { label, value };
  });

  const FormField = ({
    label,
    required,
    error,
    helperText,
    inputStyle,
    containerStyle,
    value,
    onChangeText,
    ...rest
  }) => (
    <View style={[styles.fieldContainer, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.requiredStar}> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        style={[styles.input, inputStyle, error && styles.inputError]}
        placeholderTextColor="#9AA5B1"
        value={value ?? ''}
        onChangeText={onChangeText}
        {...rest}
      />
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  const DropdownField = ({ label, placeholder, items, selectedValue, onValueChange, error, helperText, required, testID, containerStyle }) => {
    const [open, setOpen] = useState(false);
    const options = Array.isArray(items) ? items : [];
    const selectedOption = options.find((item) => item.value === selectedValue);

    const handleSelect = (value) => {
      setOpen(false);
      if (onValueChange) {
        onValueChange(value);
      }
    };

    return (
      <View style={[styles.fieldContainer, containerStyle]}>
        {label ? (
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.requiredStar}> *</Text> : null}
          </Text>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.dropdownTrigger,
            error && styles.inputError,
            selectedOption && styles.dropdownTriggerActive,
          ]}
          onPress={() => setOpen(true)}
          testID={testID}
        >
          <Text style={selectedOption ? styles.dropdownValue : styles.dropdownPlaceholder}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <Icon name="expand-more" size={22} color="#0b72b9" style={styles.dropdownIcon} />
        </TouchableOpacity>
        {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setOpen(false)}>
            <View style={styles.dropdownModalBackdrop}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.dropdownModalCard}>
                  <Text style={styles.dropdownModalTitle}>{label || 'Select an option'}</Text>
                  <ScrollView style={styles.dropdownList}>
                    {options.map((option) => {
                      const isSelected = option.value === selectedValue;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.dropdownOption,
                            isSelected && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => handleSelect(option.value)}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {isSelected ? <Icon name="check" size={18} color="#0b72b9" /> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity style={styles.modalButtonGhost} onPress={() => setOpen(false)}>
                    <Text style={styles.modalButtonGhostText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <HeaderBack title="Post a New Gig" backTo="ProviderDashboard" />

          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Share a New Gig</Text>
            <Text style={styles.heroSubtitle}>
              Detailed briefs help students self-select quickly while giving admins confidence to approve.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Opportunity Overview</Text>
            <Text style={styles.sectionSubtitle}>Tell students what they will be working on and where the work happens.</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Gig Title
                <Text style={styles.requiredStar}> *</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g. Kigali Innovation Sprint Facilitator"
                value={title}
                onChangeText={handleTitleChange}
                placeholderTextColor="#9AA5B1"
                autoCapitalize="sentences"
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Description
                <Text style={styles.requiredStar}> *</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.multiLineInput, errors.description && styles.inputError]}
                placeholder="Give a concise overview and expectations for the role."
                value={description}
                onChangeText={handleDescriptionChange}
                placeholderTextColor="#9AA5B1"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>

            <DropdownField
              label="Category"
              required
              placeholder="Select a category"
              items={categoryOptions}
              selectedValue={category}
              onValueChange={(value) => {
                setCategory(value);
                clearError('category');
              }}
              error={errors.category}
            />

            <DropdownField
              label="Location"
              required
              placeholder="Select location"
              items={locationOptions}
              selectedValue={location}
              onValueChange={(value) => {
                setLocation(value);
                clearError('location');
              }}
              error={errors.location}
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Requirements</Text>
              <TextInput
                style={[styles.input, styles.multiLineInput]}
                placeholder="Share any prerequisites, working hours, or tools needed."
                value={requirements}
                onChangeText={handleRequirementsChange}
                placeholderTextColor="#9AA5B1"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>Optional, but helps manage expectations upfront.</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Skills Highlight</Text>
              <TextInput
                style={styles.input}
                placeholder="Comma-separated skills that will stand out (e.g. Figma, Python, Public speaking)"
                value={skillsRequired}
                onChangeText={handleSkillsChange}
                placeholderTextColor="#9AA5B1"
              />
              <Text style={styles.helperText}>Optional shortlist for quick scanning.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timing & Budget</Text>
            <Text style={styles.sectionSubtitle}>Clarify when the work starts, how long it lasts, and what you are paying.</Text>

            <View style={styles.inlineField}>
              <View style={styles.inlineHalf}>
                <Text style={styles.label}>
                  Budget
                  <Text style={styles.requiredStar}> *</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Amount (e.g. 120000)"
                  keyboardType="numeric"
                  inputMode="numeric"
                  value={price}
                  onChangeText={handleBudgetChange}
                  placeholderTextColor="#9AA5B1"
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>
              <DropdownField
                label="Currency"
                required
                placeholder="Select currency"
                items={[
                  { label: 'Rwandan Franc (FRW)', value: 'FRW' },
                  { label: 'US Dollar (USD)', value: 'USD' },
                ]}
                selectedValue={currency}
                onValueChange={(value) => {
                  setCurrency(value);
                  clearError('currency');
                }}
                containerStyle={[styles.inlineHalf, styles.inlineHalfNarrow]}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Estimated Duration
                <Text style={styles.requiredStar}> *</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.duration && styles.inputError]}
                placeholder="e.g. 3 days, 6 weeks, 10 hours/week"
                value={duration}
                onChangeText={handleDurationChange}
                placeholderTextColor="#9AA5B1"
              />
              {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Deadline / Apply By
                <Text style={styles.requiredStar}> *</Text>
              </Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateButtonText}>{deadlineDisplay || 'Tap to choose a deadline'}</Text>
              </TouchableOpacity>
              {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Attachments & Media</Text>
            <Text style={styles.sectionSubtitle}>
              Add posters, detailed briefs, or sample assets. Students will see these on the gig details screen.
            </Text>

            {attachments.map((url, idx) => {
              const trimmed = url.trim();
              const canPreview = isValidUrl(trimmed);
              return (
                <View key={`attachment-${idx}`} style={styles.attachmentBlock}>
                  <View style={styles.attachmentRow}>
                    <TextInput
                      style={styles.attachmentInput}
                      placeholder="https://..."
                      value={url}
                      onChangeText={(value) => handleAttachmentChange(idx, value)}
                      onChange={(event) => {
                        if (Platform.OS === 'web') {
                          handleAttachmentChange(idx, getEventText(event));
                        }
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {canPreview ? (
                      <TouchableOpacity style={styles.attachmentAction} onPress={() => openAttachmentLink(trimmed)}>
                        <Text style={styles.attachmentActionText}>Open</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity style={styles.removeAttachmentButton} onPress={() => handleRemoveAttachment(idx)}>
                      <Text style={styles.removeAttachmentText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  {canPreview && isImageUrl(trimmed) ? (
                    <Image source={{ uri: trimmed }} style={styles.attachmentPreview} resizeMode="cover" />
                  ) : null}
                </View>
              );
            })}

            {errors.attachments && <Text style={styles.errorText}>{errors.attachments}</Text>}

            <View style={styles.attachmentActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={pickAndUpload}>
                <Text style={styles.secondaryButtonText}>Upload from device</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButtonOutline} onPress={handleAddAttachmentField}>
                <Text style={styles.secondaryButtonOutlineText}>Add URL</Text>
              </TouchableOpacity>
              {attachments.length > 0 ? (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setAttachments([]);
                    clearError('attachments');
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear all</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {formFeedback ? (
            <View
              style={[
                styles.formFeedback,
                formFeedback.type === 'error' ? styles.formFeedbackError : styles.formFeedbackSuccess,
              ]}
            >
              <Text
                style={[
                  styles.formFeedbackText,
                  formFeedback.type === 'error'
                    ? styles.formFeedbackTextError
                    : styles.formFeedbackTextSuccess,
                ]}
              >
                {formFeedback.message}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handlePostGig}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Share for Review</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showDatePicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.dateModalBackdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.dateModal}>
                <Text style={styles.dateModalTitle}>Select Deadline</Text>
                <View style={styles.datePickersRow}>
                  <View style={styles.datePickerCol}>
                    <Text style={styles.datePickerLabel}>Day</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker selectedValue={day} onValueChange={(v) => setDay(v)} style={styles.compactPicker}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <Picker.Item key={d} label={`${d}`} value={d} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.datePickerCol}>
                    <Text style={styles.datePickerLabel}>Month</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker selectedValue={month} onValueChange={(v) => setMonth(v)} style={styles.compactPicker}>
                        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                          <Picker.Item key={m} label={m} value={idx} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.datePickerCol}>
                    <Text style={styles.datePickerLabel}>Year</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker selectedValue={year} onValueChange={(v) => setYear(v)} style={styles.compactPicker}>
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                          <Picker.Item key={y} label={`${y}`} value={y} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
                <View style={styles.dateModalActions}>
                  <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalButtonPrimary} onPress={applyDate}>
                    <Text style={styles.modalButtonPrimaryText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 32,
    backgroundColor: '#F4F7FB',
  },
  container: {
    width: '92%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: '#0b72b9',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#0b72b9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#E6F2FF',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#102A43',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#5C6C80',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#243B53',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#D14343',
  },
  input: {
    height: 48,
    borderColor: '#D8E2EC',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
  },
  inputError: {
    borderColor: '#D14343',
    backgroundColor: '#FFF5F5',
  },
  helperText: {
    fontSize: 12,
    color: '#5C6C80',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#D14343',
    marginTop: 6,
  },
  formFeedback: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
  },
  formFeedbackError: {
    backgroundColor: '#FFF5F5',
    borderColor: '#D14343',
  },
  formFeedbackSuccess: {
    backgroundColor: '#E6FFFA',
    borderColor: '#0F9D58',
  },
  formFeedbackText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formFeedbackTextError: {
    color: '#8A1C1C',
  },
  formFeedbackTextSuccess: {
    color: '#05603A',
  },
  multiLineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD2D9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  dropdownTriggerActive: {
    borderColor: '#0b72b9',
    backgroundColor: '#F2F8FE',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#243B53',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#9AA5B1',
    flex: 1,
    marginRight: 8,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 67, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownModalCard: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102A43',
    marginBottom: 12,
  },
  dropdownList: {
    maxHeight: 280,
    marginBottom: 12,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  dropdownOptionSelected: {
    backgroundColor: '#F2F8FE',
    borderWidth: 1,
    borderColor: '#0b72b9',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#243B53',
    flex: 1,
    marginRight: 16,
  },
  dropdownOptionTextSelected: {
    fontWeight: '700',
    color: '#0b72b9',
  },
  modalButtonGhost: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalButtonGhostText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0b72b9',
  },
  inlineField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inlineHalf: {
    flex: 1,
    marginRight: 12,
  },
  inlineHalfNarrow: {
    flex: 0.55,
    marginRight: 0,
  },
  dateButton: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  dateButtonText: {
    color: '#243B53',
    fontSize: 14,
  },
  attachmentBlock: {
    marginBottom: 16,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },
  attachmentAction: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  attachmentActionText: {
    color: '#0b72b9',
    fontWeight: '600',
    fontSize: 13,
  },
  removeAttachmentButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FDECEA',
  },
  removeAttachmentText: {
    color: '#D14343',
    fontWeight: '600',
    fontSize: 13,
  },
  attachmentPreview: {
    height: 140,
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#E0E7FF',
    width: '100%',
  },
  attachmentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButton: {
    backgroundColor: '#0b72b9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButtonOutline: {
    borderColor: '#0b72b9',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  secondaryButtonOutlineText: {
    color: '#0b72b9',
    fontWeight: '600',
  },
  clearButton: {
    borderColor: '#D14343',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#D14343',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#0b72b9',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dateModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 42, 67, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateModal: {
    width: '82%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  dateModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102A43',
    marginBottom: 14,
    textAlign: 'center',
  },
  datePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  datePickerCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  datePickerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C6C80',
    marginBottom: 6,
    textAlign: 'center',
  },
  pickerWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    overflow: 'hidden',
  },
  compactPicker: {
    height: 90,
    width: '100%',
  },
  dateModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#E4E7EB',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#486581',
    fontWeight: '600',
    fontSize: 14,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#0b72b9',
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
