import React, { useState } from 'react';
import { View, Button, Text, Image, ActivityIndicator } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../../services/api';

export default function IDUploadScreen() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);

  function pickImage() {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (res.didCancel) return;
      if (res.errorCode) {
        console.warn('image-picker error', res.errorMessage);
        return;
      }
      if (res.assets && res.assets[0]) {
        setFile(res.assets[0]);
      }
    });
  }

  async function upload() {
    if (!file) return alert('Pick an image first');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('id_type', 'national_id');
      form.append('role', 'provider');
      form.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || `id_${Date.now()}.jpg`,
      });
      await api.post('/verification/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('uploaded');
      alert('Uploaded — admin will review.');
    } catch (err) {
      console.warn('upload failed', err);
      alert('Upload failed');
      setStatus('failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Pick ID image" onPress={pickImage} />
      {file && (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Image
            source={{ uri: file.uri }}
            style={{ width: 260, height: 160, resizeMode: 'cover', borderRadius: 8 }}
          />
          <Text style={{ marginTop: 8 }}>{file.fileName || 'selected image'}</Text>
        </View>
      )}
      <View style={{ marginTop: 16 }}>
        {uploading ? (
          <ActivityIndicator />
        ) : (
          <Button title="Upload for verification" onPress={upload} disabled={!file} />
        )}
      </View>
      {status && <Text style={{ marginTop: 14 }}>Status: {status}</Text>}
    </View>
  );
}

