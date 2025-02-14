import React from 'react';
import {View, Text, StyleSheet, ScrollView, Dimensions} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useLexicon} from '../context/LexiconContext';
import {useTheme} from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
  const {lexicon} = useLexicon();
  const {isDarkMode} = useTheme();

  if (!lexicon) return null;

  const totalWords = lexicon.length;

  // Words added in the last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentWords = lexicon.filter(word => {
    if (!word.addedDate) return false;
    const wordDate = new Date(word.addedDate);
    wordDate.setHours(0, 0, 0, 0);
    return wordDate >= sevenDaysAgo && wordDate <= today;
  });

  const uniqueDays = new Set(
    lexicon
      .filter(word => word.addedDate)
      .map(word => new Date(word.addedDate).setHours(0, 0, 0, 0)),
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  while (uniqueDays.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  const todayTime = new Date().setHours(0, 0, 0, 0);
  if (!uniqueDays.has(todayTime)) {
    streak = 0;
  }

  const streakText = streak === 1 ? 'day' : 'days';

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
          Words Added in the Last 7 Days
        </Text>
        <Text
          style={[
            styles.sectionContent,
            {color: isDarkMode ? '#fff' : '#333'},
          ]}>
          {recentWords.length === 0
            ? 'No words added in the last 7 days'
            : recentWords.length === 1
            ? '1 word added'
            : `${recentWords.length} words added`}
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
          Your Current Streak
        </Text>
        <Text
          style={[
            styles.sectionContent,
            {color: isDarkMode ? '#fff' : '#333'},
          ]}>
          {streak === 0
            ? "Let's start building a streak! 🚀"
            : `🔥 ${streak} ${streakText} in a row!`}
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
