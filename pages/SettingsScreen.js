// pages/SettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLexicon } from '../context/LexiconContext';

const SettingsScreen = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { resetLexicon } = useLexicon();

  // Dummy state for notifications toggle (replace with your own implementation)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const toggleNotifications = () => setNotificationsEnabled((prev) => !prev);

  const handleResetLexicon = () => {
    Alert.alert(
      'Reset Lexicon',
      'Are you sure you want to reset the lexicon? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetLexicon },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://my-lexi.com/privacy');
  };

  const contactSupport = () => {
    Linking.openURL('mailto:mylexisupport@gmail.com');
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#f2f2f2' },
      ]}
    >

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: isDarkMode ? '#fff' : '#333' }]}>
          Appearance
        </Text>
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}>
              Dark Mode
            </Text>
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
          </View>
        </View>
      </View>

      {/* Lexicon Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: isDarkMode ? '#fff' : '#333' }]}>
          Lexicon
        </Text>
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
          <TouchableOpacity onPress={handleResetLexicon}>
            <Text style={styles.resetText}>Reset Lexicon</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications & Language Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: isDarkMode ? '#fff' : '#333' }]}>
          Preferences
        </Text>
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}>
              Notifications
            </Text>
            <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
          </View>
          <TouchableOpacity style={styles.item} onPress={() => Alert.alert('Select Language', 'Language selection goes here.')}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}>Language</Text>
            <Text style={[styles.value, { color: isDarkMode ? '#aaa' : '#555' }]}>English</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info & Support Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeader, { color: isDarkMode ? '#fff' : '#333' }]}>
          App Info & Support
        </Text>
        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
          <View style={styles.item}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}>
              Version
            </Text>
            <Text style={[styles.value, { color: isDarkMode ? '#aaa' : '#555' }]}>1.0.0</Text>
          </View>
          <TouchableOpacity style={styles.item} onPress={openPrivacyPolicy}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={contactSupport}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}>
              Contact Support
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    // Elevation for Android
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
  },
  resetText: {
    fontSize: 16,
    color: 'red',
  },
});

export default SettingsScreen;
