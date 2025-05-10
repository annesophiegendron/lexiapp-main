import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useLexicon} from '../context/LexiconContext';
import {useTheme} from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
  const {lexicon} = useLexicon();
  const {isDarkMode} = useTheme();

  if (!lexicon) return null;

  const totalWords = lexicon.length;

  const today = new Date();
  const sevenDaysAgo = new Date(today);
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

  if (!uniqueDays.has(new Date().setHours(0, 0, 0, 0))) {
    streak = 0;
  }

  const streakText = streak === 1 ? 'day' : 'days';

  const motivationalMessage =
    streak >= 7
      ? 'Great! You are on a streak! Keep going!'
      : "You're doing great — let’s add more words!";

  return (
    <ScrollView
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? '#121212' : '#FAFAFA'},
      ]}
      contentContainerStyle={styles.scrollContent}>
      <DashboardCard
        icon="book"
        title="Total Words Added"
        value={`${totalWords}`}
        bgColor={isDarkMode ? '#2a2a2a' : '#e0f7fa'}
        isDarkMode={isDarkMode}
      />

      <DashboardCard
        icon="time"
        title="Words Added in the Last 7 Days"
        value={
          recentWords.length === 0
            ? 'No words added'
            : recentWords.length === 1
            ? '1 word added'
            : `${recentWords.length} words added`
        }
        bgColor={isDarkMode ? '#2a2a2a' : '#fffde7'}
        isDarkMode={isDarkMode}
      />

      <DashboardCard
        icon="flame"
        title="Current Streak"
        value={
          streak === 0
            ? 'Start your streak today! 🚀'
            : `🔥 ${streak} ${streakText} in a row`
        }
        subtitle={motivationalMessage}
        bgColor={isDarkMode ? '#2a2a2a' : '#fce4ec'}
        isDarkMode={isDarkMode}
      />

      <DashboardCard
        icon="rocket"
        title="Progress"
        value={`${totalWords} / 1000 words`}
        bgColor={isDarkMode ? '#2a2a2a' : '#e3f2fd'}
        isDarkMode={isDarkMode}
      />
    </ScrollView>
  );
};

const DashboardCard = ({
  icon,
  title,
  value,
  subtitle,
  bgColor,
  isDarkMode,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle?: string;
  bgColor: string;
  isDarkMode: boolean;
}) => {
  return (
    <View style={[styles.card, {backgroundColor: bgColor}]}>
      <View style={styles.headerRow}>
        <Ionicons name={icon} size={20} color={isDarkMode ? '#fff' : '#333'} />
        <Text style={[styles.cardTitle, {color: isDarkMode ? '#fff' : '#333'}]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.cardValue, {color: isDarkMode ? '#fff' : '#222'}]}>
        {value}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.cardSubtitle,
            {
              color: isDarkMode ? '#ccc' : '#555',
              maxWidth: '90%',
            },
          ]}>
          {subtitle}
        </Text>
      )}
    </View>
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
  card: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default DashboardScreen;
