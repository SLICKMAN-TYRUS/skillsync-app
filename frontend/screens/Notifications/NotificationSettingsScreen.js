import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Button } from 'react-native';
import { getNotificationSettings, setNotificationSettings } from '../../services/notifications';

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState({ email: true, push: true, promotional: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getNotificationSettings();
        setSettings(data);
      } catch (err) {
        console.warn(err);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await setNotificationSettings(settings);
      alert('Settings saved');
    } catch (err) {
      console.warn(err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent:'space-between', alignItems:'center', marginVertical:10 }}>
        <Text>Email notifications</Text>
        <Switch value={!!settings.email} onValueChange={(v) => setSettings(s => ({ ...s, email: v }))} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent:'space-between', alignItems:'center', marginVertical:10 }}>
        <Text>Push notifications</Text>
        <Switch value={!!settings.push} onValueChange={(v) => setSettings(s => ({ ...s, push: v }))} />
      </View>

      <Button title={saving ? 'Saving...' : 'Save'} onPress={save} disabled={saving} />
    </View>
  );
}

