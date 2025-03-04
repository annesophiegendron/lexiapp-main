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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useLexicon } from '../context/LexiconContext';
import { useAuth } from '../context/AuthContext'; // Import logout function

const SettingsScreen = ({ navigation }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { resetLexicon } = useLexicon();
  const { logout } = useAuth(); // Get logout function

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
    Linking.openURL('https://mylexi.app/pages/privacy-policy');
  };

  const contactSupport = () => {
    Linking.openURL('mailto:hellomylexi@outlook.com');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#f2f2f2' },
      ]}
    >
      {/* Back button and title */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text style={[styles.header, { color: isDarkMode ? '#fff' : '#000' }]}>
          Settings
        </Text>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionHeader, { color: isDarkMode ? '#fff' : '#333' }]}
        >
          Appearance
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' },
          ]}
        >
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
        <Text
          style={[styles.sectionHeader, { color: isDarkMode ? '#fff' : '#333' }]}
        >
          Lexicon
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' },
          ]}
        >
          <TouchableOpacity onPress={handleResetLexicon}>
            <Text style={styles.resetText}>Reset Lexicon</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Log Out Section */}
      <View style={styles.section}>
        <View
          style={[
            styles.card,
            { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' },
          ]}
        >
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info & Support Section */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionHeader, { color: isDarkMode ? '#fff' : '#333' }]}
        >
          App Info & Support
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' },
          ]}
        >
          <View style={styles.item}>
            <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#333' }]}>
              Version
            </Text>
            <Text style={[styles.value, { color: isDarkMode ? '#aaa' : '#555' }]}>
              1.0.0
            </Text>
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
    paddingTop: 90,
    height: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 50,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
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
  logoutText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default SettingsScreen;
