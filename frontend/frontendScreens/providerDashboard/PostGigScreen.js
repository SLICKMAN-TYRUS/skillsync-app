// screens/PostGigScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { fetchLocations, providerApi } from '../services/api';
import HeaderBack from '../../components/HeaderBack';
import ErrorBanner from '../../components/ErrorBanner';
const MOCK_API_BASE = 'http://localhost:4000';

export default function PostGigScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineDisplay, setDeadlineDisplay] = useState('');
  const [locations, setLocations] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [day, setDay] = useState(new Date().getDate());
  const [month, setMonth] = useState(new Date().getMonth()); // 0-11
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [attachments, setAttachments] = useState([]); // simple list of URLs or filenames for web shim
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('FRW');

  const pickAndUpload = async () => {
    // Try to use expo-document-picker on native; on web fall back to manual URL input
    try {
      // try to load expo-document-picker dynamically without letting webpack statically resolve it
      let DocumentPicker = null;
      try {
        // eslint-disable-next-line no-eval
        DocumentPicker = eval("require")('expo-document-picker');
      } catch (e) {
        DocumentPicker = null;
      }
      const res = DocumentPicker ? await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true }) : { type: 'cancel' };
      if (res.type !== 'success') return;
      const name = res.name || res.uri.split('/').pop();
      // request signed url from mock api
      const signedResp = await fetch(`${MOCK_API_BASE}/api/uploads/signed-url?filename=${encodeURIComponent(name)}`);
      const signedJson = await signedResp.json();
      const { uploadUrl, fileUrl } = signedJson;
      // fetch file bytes and PUT to uploadUrl
      const fileData = await fetch(res.uri);
      const blob = await fileData.blob();
      await fetch(uploadUrl, { method: 'PUT', body: blob });
      setAttachments((p) => [...p, fileUrl]);
      Alert.alert('Upload', 'Attachment uploaded');
    } catch (err) {
      console.warn('Document picker/upload failed', err);
      Alert.alert('Upload failed', err?.message || String(err));
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
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
        if (!location && merged.length) setLocation(merged[0]);
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
          if (!location) setLocation(fallback[0]);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const applyDate = () => {
    const d = new Date(year, month, day);
    setDeadline(d.toISOString().split('T')[0]);
    setDeadlineDisplay(d.toDateString());
    setErrors((prev) => ({ ...prev, deadline: undefined }));
    setShowDatePicker(false);
  };

  const handlePostGig = () => {
    // confirmation before validation & submit
    Alert.alert(
      'Confirm Post',
      'Are you sure you want to post this gig? You can edit it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: async () => {
            const e = {};
            if (!title.trim()) e.title = 'Title is required';
            if (!category) e.category = 'Category is required';
            if (!location) e.location = 'Location is required';
            if (!deadline) e.deadline = 'Date is required';
            if (!price || Number.isNaN(Number(price))) e.price = 'Valid price is required';
            if (!duration.trim()) e.duration = 'Duration is required';

            setErrors(e);
            if (Object.keys(e).length > 0) {
              const first = Object.values(e)[0];
              Alert.alert('Validation', first);
              return;
            }

            setLoading(true);
            try {
              const payload = {
                title,
                category,
                location,
                deadline,
                description,
                budget: Number(price),
                duration,
                attachments,
                currency,
              };
              if (providerApi && providerApi.createGig) {
                await providerApi.createGig(payload);
              } else {
                const api = require('../../services/api').default;
                await api.post('/gigs', payload);
              }
              Alert.alert('Success', 'Gig posted successfully');
              navigation.goBack();
            } catch (err) {
              console.error('Post gig failed', err);
              Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to post gig');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderBack title="Post a New Gig" backTo="ProviderDashboard" />

        <TextInput
          style={styles.input}
          placeholder="Gig Title"
          value={title}
          onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: undefined })); }}
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}


        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Category" value="" />
            <Picker.Item label="Design" value="Design" />
            <Picker.Item label="Tech" value="Tech" />
            <Picker.Item label="Marketing" value="Marketing" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={location}
            onValueChange={(val) => setLocation(val)}
            style={styles.picker}
          >
            <Picker.Item label="Select Location" value="" />
            {locations.map((l) => (
              <Picker.Item key={typeof l === 'string' ? l : l.id || l.name} label={typeof l === 'string' ? l : l.name || l} value={typeof l === 'string' ? l : l.name || l.id || l} />
            ))}
          </Picker>
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        <TouchableOpacity style={[styles.input, styles.dateInput]} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: deadlineDisplay ? '#000' : '#999' }}>{deadlineDisplay || 'Select Deadline / Task Date'}</Text>
        </TouchableOpacity>
        {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}

        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.dateModalBackdrop}>
            <View style={styles.dateModal}>
              <Text style={styles.dateModalTitle}>Select Date</Text>
              <View style={styles.datePickersRow}>
                <View style={styles.datePickerCol}>
                  <Text style={styles.datePickerLabel}>Day</Text>
                  <Picker selectedValue={day} onValueChange={(v) => setDay(v)} style={styles.smallPicker}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <Picker.Item key={d} label={`${d}`} value={d} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.datePickerCol}>
                  <Text style={styles.datePickerLabel}>Month</Text>
                  <Picker selectedValue={month} onValueChange={(v) => setMonth(v)} style={styles.smallPicker}>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                      <Picker.Item key={m} label={m} value={idx} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.datePickerCol}>
                  <Text style={styles.datePickerLabel}>Year</Text>
                  <Picker selectedValue={year} onValueChange={(v) => setYear(v)} style={styles.smallPicker}>
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                      <Picker.Item key={y} label={`${y}`} value={y} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={styles.dateModalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setShowDatePicker(false)}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#0b72b9' }]} onPress={applyDate}>
                  <Text style={{ color: '#fff' }}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Gig Description"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 8, color: '#333', fontWeight: '700' }}>Price</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                placeholder="Amount (e.g. 1200)"
                keyboardType="numeric"
                value={price}
                onChangeText={(v) => { setPrice(v); setErrors((e) => ({ ...e, price: undefined })); }}
              />
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>
            <View style={{ width: 12 }} />
            <View style={{ width: 120 }}>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={currency} onValueChange={(v) => setCurrency(v)} style={styles.picker}>
                  <Picker.Item label="FRW" value="FRW" />
                  <Picker.Item label="USD" value="USD" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Duration (e.g. 3 days, 2 hours)"
          value={duration}
          onChangeText={(v) => { setDuration(v); setErrors((e) => ({ ...e, duration: undefined })); }}
        />
        {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}

        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 8, color: '#333', fontWeight: '700' }}>Attachments (optional)</Text>
          {attachments.map((a, idx) => (
            <View key={`${a}-${idx}`} style={{ marginBottom: 8 }}>
              <Text style={{ color: '#0b72b9' }}>{a}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <TouchableOpacity style={[styles.smallButton, { marginRight: 8 }]} onPress={pickAndUpload}>
              <Text style={{ color: '#fff' }}>Upload from device</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#6c757d' }]} onPress={() => setAttachments([...attachments, ''])}>
              <Text style={{ color: '#fff' }}>Add URL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallButtonAlt, { marginLeft: 8 }]} onPress={() => setAttachments([])}>
              <Text style={{ color: '#0b72b9' }}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handlePostGig} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Post Gig</Text>
          )}
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
    backgroundColor: '#F4F7FB',
  },
  container: {
    width: '90%',
    maxWidth: 500,
  },
  errorText: {
    color: '#c53030',
    marginBottom: 12,
    fontSize: 13,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0b72b9',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  dateModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModal: {
    width: '90%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  dateModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  datePickersRow: { flexDirection: 'row', justifyContent: 'space-between' },
  datePickerCol: { flex: 1, alignItems: 'center' },
  datePickerLabel: { fontSize: 12, marginBottom: 6 },
  smallPicker: { width: '100%' },
  dateModalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  modalButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8, backgroundColor: '#eee' },
  pickerContainer: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: Platform.OS === 'android' ? 0 : 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 48,
    width: '100%',
  },
  button: {
    backgroundColor: '#0b72b9',
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
  smallButton: { backgroundColor: '#0b72b9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  smallButtonAlt: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#0b72b9', alignItems: 'center', justifyContent: 'center' },
});
