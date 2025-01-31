import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuiz } from '../context/QuizzContext';
import { useTheme } from '../context/ThemeContext';
import { format, parseISO, isValid } from 'date-fns';

const ResultsScreen = ({ route, navigation }) => {
  const { result } = route.params || {};
  const { pastResults, setCurrentQuestionIndex, setScore, score, totalQuestions } = useQuiz();
  const { isDarkMode } = useTheme();

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

  const formatDate = (dateStr) => {
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

  const renderQuizResults = () => {
    if (result) {
      const formattedDate = formatDate(result.date);
      const backgroundColor = calculateResultBackgroundColor(result.score, result.totalQuestions);
      const emoji = getScoreEmoji(result.score, result.totalQuestions);

      return (
        <>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#212529' }]}>
            Quiz Results
          </Text>
          <View style={[styles.resultContainer, { backgroundColor }]}>
            <Text style={[styles.resultText, { color: isDarkMode ? '#bb86fc' : '#212121' }]}>
              You scored {result.score} out of {result.totalQuestions}! {emoji}
            </Text>
          </View>
        </>
      );
    }

    return (
      <View style={styles.noResultsContainer}>
        <Text style={[styles.noResultsText, { color: isDarkMode ? '#ccc' : '#555' }]}>
          You haven't completed any quizzes yet. Start your first quiz now!
        </Text>
        <TouchableOpacity
          style={[styles.startQuizButton, { backgroundColor: isDarkMode ? '#3700B3' : '#6200EE' }]}
          onPress={handleStartNewQuiz}
        >
          <Text style={styles.startQuizButtonText}>Start Your First Quiz</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#FAFAFA' }]}>
      {renderQuizResults()}

      {pastResults.length > 0 && (
        <>
          <Text style={[styles.historyTitle, { color: isDarkMode ? '#fff' : '#212529' }]}>Past Results</Text>
          <View style={[styles.pastResultsContainer, { backgroundColor: isDarkMode ? '#333' : '#F5F5F5' }]}>
            <FlatList
              data={pastResults}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => {
                const formattedDate = formatDate(item.date);
                const backgroundColor = calculateResultBackgroundColor(item.score, item.totalQuestions);
                return (
                  <View style={[styles.historyItem, { backgroundColor }]}>
                    <Text style={[styles.historyText, { color: isDarkMode ? '#fff' : '#212529' }]}>
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
    padding: 30,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  resultText: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 28,
  },
  resultContainer: {
    width: '100%',
    paddingVertical: 30,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 40,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  noResultsText: {
    fontSize: 20,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '500',
  },
  startQuizButton: {
    paddingVertical: 16,
    paddingHorizontal: 45,
    backgroundColor: '#6200EE',
    borderRadius: 30,
    elevation: 5,
    alignItems: 'center',
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startQuizButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  historyTitle: {
    fontSize: 26,
    fontWeight: '600',
    marginVertical: 20,
    letterSpacing: 1,
  },
  pastResultsContainer: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 20,
    backgroundColor: '#EDEDED',
  },
  historyItem: {
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderRadius: 15,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212529',
    textAlign: 'center',
  },
});

export default ResultsScreen;
