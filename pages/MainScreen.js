import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import Ionicons from 'react-native-vector-icons/Ionicons';

// Context/hooks
import { useLexicon } from '../context/LexiconContext';
import { useTheme } from '../context/ThemeContext';

// Components
import AddWordScreen from './AddWordScreen';

// Design and constants
import { designSystem } from '../design';
import { categoryIcons, categoryColors, categoryColorsLight } from '../constants.js';


const MainScreen = () => {
const [modalVisible, setModalVisible] = useState(false);
const navigation = useNavigation();

// Context and theme
const { lexicon } = useLexicon();
const { isDarkMode } = useTheme();

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

const navigateToCategoryWords = (category) => {
  const filteredWords = lexicon.filter(word => word.category === category);
  navigation.navigate('CategoryWords', { category, words: filteredWords });
};

const navigateToQuizScreen = () => {
  navigation.navigate('QuizzScreen');
};


  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? backgroundDark : backgroundLight }]}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.card, styles.actionButton, { backgroundColor: isDarkMode ? cardBackgroundDark : cardBackgroundLight }]}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.textContainer}>
            <Text style={[styles.buttonTextAction, { color: isDarkMode ? textLight : textDark }]}>Add New Word</Text>
            <Text style={[styles.descriptionText, { color: isDarkMode ? '#CCC' : '#666' }]}>Click here every time you learn a new word.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.actionButton, { backgroundColor: isDarkMode ? cardBackgroundDark : cardBackgroundLight }]}
          onPress={navigateToQuizScreen}
        >
          <View style={styles.textContainer}>
            <Text style={[styles.buttonTextAction, { color: isDarkMode ? textLight : textDark }]}>Start Quiz</Text>
            <Text style={[styles.descriptionText, { color: isDarkMode ? '#CCC' : '#666' }]}>Test the words you've added.</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: isDarkMode ? textLight : textDark }]}>Categories</Text>
      <View style={styles.categoriesContainer}>
        {Object.keys(categoryIcons).map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryCard, {
              backgroundColor: categoryColorsLight[category] || (isDarkMode ? cardBackgroundDark : cardBackgroundLight),
            }]}
            onPress={() => navigateToCategoryWords(category)}
          >
            <View style={styles.textContainer}>
              <Ionicons 
                name={categoryIcons[category]} 
                size={22} 
                color={categoryColors[category] || (isDarkMode ? textLight : textDark)} 
              />
              <Text style={[styles.buttonText, { color: isDarkMode ? textLight : textDark }]}>{category}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Card styles
  card: {
    borderRadius: 12,
    width: '48%',
    padding: 10,
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
    transform: [{ translateX: -45 }, { translateY: -45 }],
    opacity: 0.2,
  },

  // Button styles
  actionButton: {
    backgroundColor: 'rgba(217, 217, 217, 0.3)',
    elevation: 5,
    transform: [{ scale: 1 }],
    transition: 'transform 0.3s',
    padding: 24,
  },

  // Text styles
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',

  },
  buttonTextAction: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '6'
  },
  descriptionText: {
    fontSize: 13,
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
