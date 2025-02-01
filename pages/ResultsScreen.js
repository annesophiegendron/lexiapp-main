import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {useQuiz} from '../context/QuizzContext';
import {useTheme} from '../context/ThemeContext';
import {format, parseISO, isValid} from 'date-fns';

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

  const handleStartNewQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    navigation.navigate('QuizzScreen');
  };

  const formatDate = dateStr => {
    if (!dateStr) return 'No date available';
    const cleanedDateStr = dateStr.replace(', ', 'T');
    const parsedDate = parseISO(cleanedDateStr);

    return isValid(parsedDate) ? format(parsedDate, 'PPP') : 'Invalid Date';
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
          const formattedDate = formatDate(item.date);
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
                <Text style={styles.historyDate}>{formattedDate}</Text>
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
      {result && (
        <View style={styles.resultContainer}>
          <Text
            style={[styles.title, {color: isDarkMode ? '#fff' : '#212529'}]}>
            Quiz Results
          </Text>
          <Text
            style={[
              styles.resultText,
              {color: isDarkMode ? '#bb86fc' : '#212121'},
            ]}>
            You scored {result.score} out of {result.totalQuestions}!{' '}
            {getScoreEmoji(result.score, result.totalQuestions)}
          </Text>
          <Text
            style={[styles.resultDate, {color: isDarkMode ? '#ccc' : '#666'}]}>
            Completed on {formatDate(result.date)}
          </Text>
        </View>
      )}

      <View style={styles.streakContainer}>
        <Text
          style={[
            styles.streakTitle,
            {color: isDarkMode ? '#fff' : '#212529'},
          ]}>
          Your Daily Streak: {getDailyStreak()}{' '}
          {getDailyStreak() === 1 ? 'day' : 'days'}
        </Text>
      </View>

      {pastResults.length > 0 && (
        <View style={styles.historyContainer}>
          <Text
            style={[
              styles.historyTitle,
              {color: isDarkMode ? '#fff' : '#212529'},
            ]}>
            Past Results
          </Text>
          {renderPastResults()}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.startQuizButton,
          {backgroundColor: isDarkMode ? '#3700B3' : '#6200EE'},
        ]}
        onPress={handleStartNewQuiz}>
        <Text style={styles.startQuizButtonText}>Start New Quiz</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    marginBottom: 20,
    letterSpacing: 1.5,
    textAlign: 'center',
    color: '#212529',
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
  resultDate: {
    fontSize: 16,
    marginTop: 10,
    color: '#666',
  },
  streakContainer: {
    padding: 15,
    backgroundColor: '#e6e6e6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyContainer: {
    marginTop: 30,
    width: '100%',
  },
  historyTitle: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
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
  historyDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
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
  startQuizButton: {
    paddingVertical: 16,
    paddingHorizontal: 45,
    backgroundColor: '#6200EE',
    borderRadius: 30,
    elevation: 5,
    alignItems: 'center',
    shadowColor: '#6200EE',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startQuizButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ResultsScreen;
