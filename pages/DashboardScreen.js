import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ProgressBarAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons
import {useLexicon} from '../context/LexiconContext';
import {useTheme} from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
  const {lexicon} = useLexicon();
  const {isDarkMode} = useTheme();

  if (!lexicon) return null;

  // Total words added
  const totalWords = lexicon.length;

  // Calculate words added in the last 7 days
  const recentWords = lexicon.filter(word => {
    const wordDate = new Date(word.addedDate);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return wordDate >= sevenDaysAgo;
  });

  // Track user streak
  const streak = lexicon.reduce((acc, word) => {
    const wordDate = new Date(word.addedDate);
    const lastStreakDate = new Date();
    lastStreakDate.setDate(lastStreakDate.getDate() - acc);
    return wordDate >= lastStreakDate ? acc + 1 : acc;
  }, 1);

  // Motivation message
  const motivationalMessage =
    streak >= 7
      ? 'Great! You are on a streak! Keep going!'
      : "You are doing great! Let's continue adding more words!";

  return (
    <ScrollView
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? '#121212' : '#ffffff'},
      ]}
      contentContainerStyle={styles.scrollContent}>
      {/* Total Words Section */}
      <View
        style={[
          styles.section,
          {backgroundColor: isDarkMode ? '#333' : '#e9f7ff'},
        ]}>
        <Text
          style={[styles.sectionHeader, {color: isDarkMode ? '#fff' : '#333'}]}>
          <Ionicons
            name="book"
            size={20}
            color={isDarkMode ? '#fff' : '#333'}
          />{' '}
          {/* Icon added */}
          Total Words Added
        </Text>
        <Text
          style={[
            styles.sectionContent,
            {color: isDarkMode ? '#fff' : '#333'},
          ]}>
          {totalWords}
        </Text>
      </View>

      {/* Recent Activity Section */}
      <View
        style={[
          styles.section,
          {backgroundColor: isDarkMode ? '#333' : '#f5f5f5'},
        ]}>
        <Text
          style={[styles.sectionHeader, {color: isDarkMode ? '#fff' : '#333'}]}>
          <Ionicons
            name="time"
            size={20}
            color={isDarkMode ? '#fff' : '#333'}
          />{' '}
          {/* Icon added */}
          Words Added in the Last 7 Days
        </Text>
        <Text
          style={[
            styles.sectionContent,
            {color: isDarkMode ? '#fff' : '#333'},
          ]}>
          {recentWords.length} new words
        </Text>
      </View>

      {/* Streak Section */}
      <View
        style={[
          styles.section,
          {backgroundColor: isDarkMode ? '#333' : '#ffe5b4'},
        ]}>
        <Text
          style={[styles.sectionHeader, {color: isDarkMode ? '#fff' : '#333'}]}>
          <Ionicons
            name="flame"
            size={20}
            color={isDarkMode ? '#fff' : '#333'}
          />{' '}
          {/* Icon added */}
          Your Current Streak
        </Text>
        <Text
          style={[
            styles.sectionContent,
            {color: isDarkMode ? '#fff' : '#333'},
          ]}>
          {streak} days in a row!
        </Text>
        <Text
          style={[
            styles.motivationalText,
            {color: isDarkMode ? '#fff' : '#333'},
          ]}>
          {motivationalMessage}
        </Text>
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.section,
          {backgroundColor: isDarkMode ? '#333' : '#d0e8e2'},
        ]}>
        <Text
          style={[styles.sectionHeader, {color: isDarkMode ? '#fff' : '#333'}]}>
          <Ionicons
            name="rocket"
            size={20}
            color={isDarkMode ? '#fff' : '#333'}
          />{' '}
          {/* Icon added */}
          Progress
        </Text>
        <Text
          style={[
            styles.sectionContent,
            {color: isDarkMode ? '#fff' : '#333'},
          ]}>
          {totalWords} / 1000 words
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContent: {
    fontSize: 18,
    fontWeight: '400',
  },
  motivationalText: {
    fontSize: 16,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default DashboardScreen;
