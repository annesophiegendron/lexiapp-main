import React, {useEffect} from 'react';
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
  } = useQuiz();
  const {isDarkMode} = useTheme();

  useEffect(() => {
    if (result && result.score === totalQuestions) {
      setScore(0);
    }
  }, [result, totalQuestions, setScore]);

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
    if (percentage < 50) return '#FFCDD2'; // Light red
    if (percentage >= 50 && percentage < 75) return '#FFEB3B'; // Orange
    return '#81C784'; // Green
  };

  const getScoreEmoji = (score, totalQuestions) => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage < 50) return '😞';
    if (percentage >= 50 && percentage < 75) return '😐';
    return '😊';
  };

  const renderQuizResults = () => {
    if (result) {
      const formattedDate = formatDate(result.date);
      const backgroundColor = calculateResultBackgroundColor(
        result.score,
        result.totalQuestions,
      );
      const emoji = getScoreEmoji(result.score, result.totalQuestions);

      return (
        <>
          <Text style={[styles.title, {color: isDarkMode ? '#fff' : '#333'}]}>
            Quiz Results
          </Text>
          <View style={[styles.resultContainer, {backgroundColor}]}>
            <Text
              style={[
                styles.resultText,
                {color: isDarkMode ? '#bb86fc' : '#6200EE'},
              ]}>
              You scored {result.score} out of {result.totalQuestions}! {emoji}
            </Text>
          </View>
        </>
      );
    }

    return (
      <View style={styles.noResultsContainer}>
        <Text
          style={[styles.noResultsText, {color: isDarkMode ? '#ccc' : '#555'}]}>
          You haven't completed any quizzes yet. Start your first quiz now!
        </Text>
        <TouchableOpacity
          style={[
            styles.startQuizButton,
            {backgroundColor: isDarkMode ? '#3700B3' : '#6200EE'},
          ]}
          onPress={handleStartNewQuiz}>
          <Text style={styles.startQuizButtonText}>Start Your First Quiz</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? '#121212' : '#f8f8f8'},
      ]}>
      {renderQuizResults()}

      {pastResults.length > 0 && (
        <>
          <Text
            style={[
              styles.historyTitle,
              {color: isDarkMode ? '#fff' : '#333'},
            ]}>
            Past Results
          </Text>
          <View
            style={[
              styles.pastResultsContainer,
              {backgroundColor: isDarkMode ? '#333' : '#f2f2f2'},
            ]}>
            <FlatList
              data={pastResults}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) => {
                const formattedDate = formatDate(item.date);
                const backgroundColor = calculateResultBackgroundColor(
                  item.score,
                  item.totalQuestions,
                );
                return (
                  <View style={[styles.historyItem, {backgroundColor}]}>
                    <Text style={[styles.historyText, {color: '#333'}]}>
                      {formattedDate}: {item.score}/{item.totalQuestions}
                    </Text>
                  </View>
                );
              }}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultText: {
    fontSize: 20,
    marginVertical: 10,
  },
  resultContainer: {
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  noResultsText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  startQuizButton: {
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  startQuizButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
  },
  pastResultsContainer: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#333',
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  historyItem: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyText: {
    fontSize: 14,
    color: '#fff',
  },
});

export default ResultsScreen;
