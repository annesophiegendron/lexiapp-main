import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useQuiz } from '../context/QuizzContext'; 
import { useTheme } from '../context/ThemeContext';
import { designSystem } from '../design';

const { height } = Dimensions.get('window');

const ResultScreen = ({ route }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { backgroundLight, backgroundDark, textLight, textDark } = designSystem.colors;

  const { score, totalQuestions } = useQuiz(); 

  const scorePercentage = totalQuestions > 0 ? `${Math.round((score / totalQuestions) * 100)}%` : '0%';

  const motivationalText =
    score >= 70
      ? "Nice work! You're making real progress 🧠"
      : score >= 50
      ? "You're getting there! Keep it up 💡"
      : "Every step counts — you're learning and improving! 💪";

  const cardTitle = score >= 70 ? 'Great Job!' : 'Nice Try!';

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? backgroundDark : backgroundLight },
      ]}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.innerWrapper}>
        <Text
          style={[styles.title, { color: isDarkMode ? textLight : textDark }]}>
          Your Result
        </Text>

        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>{cardTitle}</Text>
          <Text style={styles.cardScore}>
            {score} / {totalQuestions} correct
          </Text>
          <Text style={styles.cardSubtitle}>
            Score:{' '}
            <Text style={styles.scoreHighlight}>{scorePercentage}</Text>
          </Text>
          <Text style={styles.motivationalText}>{motivationalText}</Text>
        </View>

        <View style={styles.actionButtonsWrapper}>
          <TouchableOpacity
            style={styles.backHomeButton}
            onPress={() => navigation.navigate('Main')}>
            <Ionicons name="home" size={20} color="#000" />
            <Text style={styles.backHomeText}>Back Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={() => navigation.navigate('QuizzScreen')}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    minHeight: height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  innerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
  },
  resultCard: {
    backgroundColor: '#d7d0fd',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  cardScore: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  scoreHighlight: {
    backgroundColor: '#ffecbb',
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  motivationalText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  actionButtonsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  backHomeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  backHomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  playAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 8,
    backgroundColor: '#000',
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default ResultScreen;
