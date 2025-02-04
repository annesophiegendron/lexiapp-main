import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useQuiz} from '../context/QuizzContext';
import {useTheme} from '../context/ThemeContext';
import {format, parseISO, isValid} from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ResultsScreen = ({route, navigation}) => {
  const {result} = route.params || {};
  const {
    pastResults,
    setCurrentQuestionIndex,
    setScore,
    score,
    totalQuestions,
    lastQuizDate,
  } = useQuiz();
  const {isDarkMode} = useTheme();

  const handleGoBack = () => {
    navigation.goBack();
  };

  const calculateResultBackgroundColor = (score, totalQuestions) => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage < 50) return '#FF4F58'; // Trendy red
    if (percentage >= 50 && percentage < 75) return '#FFCA2D'; // Trendy yellow
    return '#27AE60'; // Trendy green
  };

  const getScoreEmoji = (score, totalQuestions) => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage < 50) return '😞';
    if (percentage >= 50 && percentage < 75) return '😐';
    return '😊';
  };

  const getDailyStreak = () => {
    if (!pastResults || pastResults.length === 0) {
      return 0; // No results means no streak
    }

    // Start from the most recent result
    let streak = 1;
    let lastDate = parseISO(pastResults[0].date);

    for (let i = 1; i < pastResults.length; i++) {
      const currentDate = parseISO(pastResults[i].date);

      // Check if the current result is from the previous day
      if (currentDate.getDate() === lastDate.getDate() + 1) {
        streak++;
      } else {
        break; // Streak breaks if there's a gap
      }

      lastDate = currentDate;
    }

    return streak;
  };

  const renderPastResults = () => {
    return (
      <FlatList
        data={pastResults}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => {
          const backgroundColor = calculateResultBackgroundColor(
            item.score,
            item.totalQuestions,
          );
          const emoji = getScoreEmoji(item.score, item.totalQuestions);
          const isBestScore =
            item.score === Math.max(...pastResults.map(result => result.score));

          return (
            <View
              style={[
                styles.historyItem,
                {backgroundColor: isBestScore ? '#FFD700' : backgroundColor},
              ]}>
              <View style={styles.historyItemHeader}>
                {isBestScore && (
                  <Text style={styles.bestScoreBadge}>🏆 Best Score</Text>
                )}
              </View>
              <Text style={styles.historyText}>
                Score: {item.score}/{item.totalQuestions} {emoji}
              </Text>
            </View>
          );
        }}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? '#121212' : '#FAFAFA'},
      ]}>
      {/* Back Button */}
      <View style={styles.backButton}>
        <Ionicons
          name="arrow-back"
          size={30}
          color={isDarkMode ? '#fff' : '#212529'}
          onPress={handleGoBack}
        />
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <Text
            style={[
              styles.resultText,
              {color: isDarkMode ? '#bb86fc' : '#212121'},
            ]}>
            You scored {result.score} out of {result.totalQuestions}!{' '}
            {getScoreEmoji(result.score, result.totalQuestions)}
          </Text>
        </View>
      )}

      {/* Lightning Strike Icon */}
      <View style={styles.streakContainer}>
        <Ionicons
          name="flash"
          size={50}
          color={isDarkMode ? '#FFD700' : '#FF6347'}
          style={styles.streakIcon}
        />
        <Text style={[styles.streakTitle]}>
          Your Daily Streak: {getDailyStreak()}{' '}
          {getDailyStreak() === 1 ? 'day' : 'days'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  header: {
    position: 'absolute',
    top: 30,
    left: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    marginBottom: 20,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 28,
  },
  resultContainer: {
    width: '100%',
    paddingVertical: 30,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  streakContainer: {
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#e6e6e6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    marginBottom: 40,
  },
  streakTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  streakIcon: {
    marginBottom: 10,
  },
  historyItem: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  bestScoreBadge: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  historyText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
    color: '#212529',
  },
  backButton: {
    position: 'absolute',
    top: 70,
    left: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 50,
  },
});

export default ResultsScreen;
