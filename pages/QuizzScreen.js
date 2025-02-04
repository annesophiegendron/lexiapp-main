import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';
import { useLexicon } from '../context/LexiconContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useQuiz } from '../context/QuizzContext';
import AddWordScreen from './AddWordScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';

const QuizzScreen = () => {
  const { lexicon } = useLexicon();
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    score,
    setScore,
    pastResults,
    setPastResults,
  } = useQuiz();

  const shuffledLexicon = useMemo(() => {
    return lexicon.length >= 4
      ? lexicon.sort(() => Math.random() - 0.5).slice(0, 10)
      : [];
  }, [lexicon]);

  const [answerOptions, setAnswerOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [buttonColor, setButtonColor] = useState(null); // Track button color separately
  const [modalVisible, setModalVisible] = useState(false); // Add modalVisible state

  const currentQuestion = shuffledLexicon[currentQuestionIndex];

  const handleCloseModal = () => setModalVisible(false);

  useEffect(() => {
    if (currentQuestion) {
      const generateAnswerOptions = correctTranslation => {
        const optionsSet = new Set();
        optionsSet.add(correctTranslation);

        while (optionsSet.size < 4) {
          const randomTranslation =
            shuffledLexicon[Math.floor(Math.random() * shuffledLexicon.length)]
              .translation;
          if (randomTranslation !== correctTranslation) {
            optionsSet.add(randomTranslation);
          }
        }

        return Array.from(optionsSet).sort(() => Math.random() - 0.5);
      };

      setAnswerOptions(generateAnswerOptions(currentQuestion.translation));
      setFeedback(null);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setButtonColor(null); // Reset button color when question changes
    }
  }, [currentQuestion, shuffledLexicon]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shuffledLexicon.length > 0) {
      const progress = (currentQuestionIndex + 1) / shuffledLexicon.length;
      console.log('Progress:', progress);

      // Animate the progress bar width
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false, // false because we're animating the width
      }).start();
    }
  }, [currentQuestionIndex, shuffledLexicon.length]);

  const handleAnswer = selectedTranslation => {
    const isCorrect = selectedTranslation === currentQuestion.translation;

    // Trigger haptic feedback based on correctness
    HapticFeedback.trigger(
      isCorrect ? 'notificationSuccess' : 'notificationError',
    );

    // Set selected answer
    setSelectedAnswer(selectedTranslation);
    setIsAnswerChecked(true); // Mark answer as checked

    // Reset feedback immediately, then update after animation
    setFeedback(null);

    // Animate the scaling effect for the button
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After animation ends, change the button color
      setButtonColor(isCorrect ? '#479c93' : '#ff4d4d'); // Green for correct, Red for wrong

      // Set feedback after the animation
      setFeedback({
        type: isCorrect ? 'correct' : 'wrong',
        message: isCorrect
          ? 'Correct!'
          : `Wrong! The answer was: ${currentQuestion.translation}`,
      });
      // Update score if correct
      if (isCorrect) setScore(score + 1);
      // Animate feedback container for visibility
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Wait a moment before proceeding to the next question or showing the result
        setTimeout(() => {
          if (currentQuestionIndex + 1 < shuffledLexicon.length) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
            const result = {
              score: score + (isCorrect ? 1 : 0),
              totalQuestions: shuffledLexicon.length,
              date: new Date().toLocaleString(),
            };
            setPastResults(prevResults => [...prevResults, result]);
            navigation.navigate('ResultsScreen', { result });
            // Reset quiz after completing all questions
            setCurrentQuestionIndex(0);
            setScore(0);
          }
        }, 1000); // Delay before moving to the next question
      });
    });
  };

  if (lexicon.length < 4) {
    return (
      <View style={[styles.container(isDarkMode), { justifyContent: 'center' }]}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}>
          <View style={styles.card(isDarkMode)}>
            <Text style={styles.cardTitle(isDarkMode)}>Not Enough Words</Text>
            <Text style={styles.cardMessage(isDarkMode)}>
              You need at least 4 words in your lexicon to start the quiz. Add more words to continue learning!
            </Text>
            <Ionicons
              name="add-circle-outline"
              size={30}
              color={isDarkMode ? '#ffffff' : '#333333'}
              style={styles.addWordIcon}
            />
          </View>
        </TouchableOpacity>
        <AddWordScreen isVisible={modalVisible} onClose={handleCloseModal} />
      </View>
    );
  }

  return (
    <View style={styles.container(isDarkMode)}>
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar(isDarkMode),
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.quizzTitle(isDarkMode)}>
        Can you find the translation for this word?
      </Text>
      <View style={styles.questionCard(isDarkMode)}>
        <Text style={styles.questionText(isDarkMode)}>
          {currentQuestion.original}
        </Text>
      </View>
      <View style={styles.answersContainer}>
  {answerOptions.map((translation, index) => (
    <TouchableOpacity
      key={index}
      onPress={() => handleAnswer(translation)}
      style={[
        styles.answerButton(isDarkMode),
        {
          backgroundColor: isAnswerChecked
            ? selectedAnswer === translation
              ? buttonColor
              : isDarkMode
              ? '#37474f'
              : '#f6f6f6'
            : isDarkMode
            ? '#37474f'
            : '#f6f6f6',
        },
      ]}>
      <Text style={styles.answerText(isDarkMode)}>{translation}</Text>
    </TouchableOpacity>
  ))}

  {isAnswerChecked && feedback && (
    <Text
      style={[
        styles.feedbackMessage,
        { color: feedback.type === 'correct' ? '#479c93' : '#ff4d4d' },
      ]}>
      {feedback.type === 'correct'
        ? 'Correct!'
        : `The correct answer is: ${currentQuestion.translation}`}
    </Text>
  )}
</View>

      <View style={styles.questionCard(isDarkMode)}>
        {isAnswerChecked && feedback && (
          <Text
            style={[
              styles.feedbackMessage,
              { color: feedback.type === 'correct' ? '#479c93' : '#ff4d4d' },
            ]}>
            {feedback.type === 'correct'
              ? ''
              : ''}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: isDarkMode => ({
    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    width: '70%',
    maxWidth: 350,
    marginVertical: 20,
  }),
  cardTitle: isDarkMode => ({
    fontSize: 22,
    fontWeight: 'bold',
    color: isDarkMode ? '#ffffff' : '#333333',
    marginBottom: 15,
    textAlign: 'center',
  }),
  cardMessage: isDarkMode => ({
    fontSize: 16,
    color: isDarkMode ? '#cccccc' : '#555555',
    textAlign: 'center',
    lineHeight: 22,
  }),
  container: isDarkMode => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    padding: 20,
  }),
  addWordIcon: {
    marginTop: 20,
    alignSelf: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    top: 50,
    height: 8,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
  progressBar: isDarkMode => ({
    height: '100%',
    backgroundColor: isDarkMode ? '#4caf50' : '#C1A3D9',
    borderRadius: 10,
  }),
  quizzTitle: isDarkMode => ({
    color: isDarkMode ? '#ffffff' : '#333333',
    fontSize: 15,
    fontWeight: 'bold',
  }),
  questionCard: isDarkMode => ({
    marginVertical: 10,
    padding: 5,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  questionText: isDarkMode => ({
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    top: 20,
    color: isDarkMode ? '#ffffff' : '#333333',
    textAlign: 'center',
  }),
  answersContainer: {
    flexDirection: 'column', // stacked vertically
    justifyContent: 'center',
    alignItems: 'stretch',
    width: '100%',
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  answerButton: isDarkMode => ({
    backgroundColor: isDarkMode ? '#37474f' : '#f6f6f6',
    width: '100%',
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  }),
  answerText: isDarkMode => ({
    color: isDarkMode ? '#ffffff' : '#333333',
    fontSize: 18,
    textAlign: 'center',
  }),
  feedbackMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default QuizzScreen;
