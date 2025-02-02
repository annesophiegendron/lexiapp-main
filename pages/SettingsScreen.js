// pages/SettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLexicon } from '../context/LexiconContext';

const SettingsScreen = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { resetLexicon } = useLexicon();

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

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDarkMode ? '#121212' : '#f2f2f2' },
      ]}
    >
      <Text style={[styles.header, { color: isDarkMode ? '#fff' : '#333' }]}>
        Settings
      </Text>

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
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
  label: {
    fontSize: 18,
  },
  resetText: {
    fontSize: 16,
    color: 'red',
  },
});

export default SettingsScreen;
