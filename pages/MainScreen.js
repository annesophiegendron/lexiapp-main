import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import Ionicons from 'react-native-vector-icons/Ionicons';

// Context/hooks
import {useLexicon} from '../context/LexiconContext';
import {useTheme} from '../context/ThemeContext';

// Components
import AddWordScreen from './AddWordScreen';

// Design and constants
import {designSystem} from '../design';
import {
  categoryIcons,
  categoryColors,
  categoryColorsLight,
} from '../constants.js';

const MainScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  // Context and theme
  const {lexicon} = useLexicon();
  const {isDarkMode} = useTheme();

  const {
    backgroundLight,
    backgroundDark,
    cardBackgroundLight,
    cardBackgroundDark,
    textLight,
    textDark,
  } = designSystem.colors;

  // Handlers
  const handleClose = () => {
    setModalVisible(false);
  };

  const navigateToCategoryWords = category => {
    const filteredWords = lexicon.filter(word => word.category === category);
    navigation.navigate('CategoryWords', {category, words: filteredWords});
  };

  const navigateToQuizScreen = () => {
    navigation.navigate('QuizzScreen');
  };

  return (
    <ScrollView
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? backgroundDark : backgroundLight},
      ]}>
      <Text
        style={[styles.topTitle, {color: isDarkMode ? textLight : textDark}]}>
        Add words with translations and meanings to your lexicon
      </Text>

      <Text style={[styles.title, {color: isDarkMode ? textLight : textDark}]}>
        Categories
      </Text>
      <View style={styles.categoriesContainer}>
        {Object.keys(categoryIcons).map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryCard,
              {
                backgroundColor:
                  categoryColorsLight[category] ||
                  (isDarkMode ? cardBackgroundDark : cardBackgroundLight),
              },
            ]}
            onPress={() => navigateToCategoryWords(category)}>
            {/* Background Icon */}
            <Ionicons
              name={categoryIcons[category]}
              size={70}
              color={
                isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }
              style={styles.categoryIconBackground}
            />

            {/* Category Title */}
            <Text
              style={[
                styles.buttonText,
                {color: isDarkMode ? textLight : textDark},
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.title, {color: isDarkMode ? textLight : textDark}]}>
        Challenge yourself
      </Text>

      <TouchableOpacity
        style={[
          styles.card,
          styles.actionButton,
          {
            backgroundColor: isDarkMode
              ? cardBackgroundDark
              : cardBackgroundLight,
          },
        ]}
        onPress={navigateToQuizScreen}>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.buttonTextAction,
              {color: isDarkMode ? textLight : textDark},
            ]}>
            Start Quiz
          </Text>
          <Text
            style={[
              styles.descriptionText,
              {color: isDarkMode ? '#CCC' : '#666'},
            ]}>
            Test the words you've added.
          </Text>
        </View>
      </TouchableOpacity>

      <AddWordScreen isVisible={modalVisible} onClose={handleClose} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    padding: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Card styles
  card: {
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexDirection: 'column',
    elevation: 5,
  },
  categoryCard: {
    borderRadius: 12,
    width: '30%',
    marginVertical: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  categoryIconBackground: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -27}, {translateY: -27}],
  },

  // Button styles
  actionButton: {
    backgroundColor: 'rgba(217, 217, 217, 0.3)',
    elevation: 5,
    transform: [{scale: 1}],
    transition: 'transform 0.3s',
    padding: 24,
    marginVertical: 16,
  },

  // Text styles
  topTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginVertical: 14,
    color: '#262626',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonTextAction: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '6',
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
  },

  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    position: 'relative',
  },
});

export default MainScreen;
