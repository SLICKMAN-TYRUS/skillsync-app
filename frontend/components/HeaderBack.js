import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

export default function HeaderBack({ title, backTo }) {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          if (backTo) {
            // If auth screens are nested under the 'Auth' stack, navigate there explicitly
            if (backTo === 'Login' || backTo === 'SignUp') {
              navigation.navigate('Auth', { screen: backTo });
            } else {
              navigation.navigate(backTo);
            }
          } else {
            navigation.goBack();
          }
        }}
        style={styles.backButton}
      >
        <Icon name="arrow-back" size={24} color="#0b72b9" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, backgroundColor: 'transparent' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#243444' },
});
