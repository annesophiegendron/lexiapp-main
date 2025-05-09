import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import {useLexicon} from '../context/LexiconContext';
import {useTheme} from '../context/ThemeContext';

import AddWordScreen from './AddWordScreen';

import {designSystem} from '../design';
import {
  categoryIcons,
  categoryColors,
  categoryColorsLight,
} from '../constants.js';

const MainScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const navigation = useNavigation();
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

  const filteredItems = lexicon.filter(item => {
    const matchesSearch =
      item.original.toLowerCase().includes(searchText.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory =
      selectedCategories.length === 0 ||
      item.categories?.some(cat => selectedCategories.includes(cat));

    return matchesSearch && matchesCategory;
  });

  return (
    <ScrollView
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? backgroundDark : backgroundLight},
      ]}>
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>
          {new Date().getDate()}{' '}
          {new Date().toLocaleString('en-US', {month: 'long'})}
        </Text>
        <Text style={styles.weekdayText}>
          {new Date().toLocaleString('en-US', {weekday: 'long'})}
        </Text>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          style={[styles.searchBar, searchText ? styles.searchBarFocused : {}]}
          placeholder="Search..."
          placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
          value={searchText}
          onChangeText={setSearchText}
        />

        {searchText.length > 0 && (
          <View style={styles.dropdown}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.searchResultItem,
                    {
                      backgroundColor: isDarkMode ? cardBackgroundDark : '#fff',
                      borderColor: '#ccc',
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate('WordDetail', {word: item})
                  }>
                  <Text
                    style={{
                      color: isDarkMode ? textLight : textDark,
                      fontWeight: '600',
                    }}>
                    {item.original} → {item.translation}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text
                style={{padding: 10, color: isDarkMode ? textLight : textDark}}>
                No results found.
              </Text>
            )}
          </View>
        )}
      </View>

      <Text style={[styles.title, {color: isDarkMode ? textLight : textDark}]}>
        Browse by Category
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

            <Text
              style={[
                styles.categoryText,
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
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'column',
  },

  categoryIconBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: 70,
  },

  categoryText: {
    position: 'absolute',
    transform: [{translateX: -35}, {translateY: -35}],
    fontWeight: '600',
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    width: '100%',
  },

  // Button styles
  actionButton: {
    backgroundColor: 'rgba(217, 217, 217, 0.3)',
    elevation: 5,
    transform: [{scale: 1}],
    transition: 'transform 0.3s',
    padding: 24,
    marginVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Text styles
  topTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginVertical: 14,
    color: '#262626',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 7,
    color: '#8C8C8C',
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
  dateContainer: {
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '700',
  },
  weekdayText: {
    fontSize: 26,
    fontWeight: '500',
  },

  searchResultItem: {
    padding: 10,
    marginVertical: 4,
    marginHorizontal: 4,
  },
  searchBar: {
    width: '100%',
    height: 45,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
    elevation: 5,
    borderColor: '#000',
    borderWidth: 1,
  },

  searchWrapper: {
    position: 'relative',
    marginBottom: 20,
    zIndex: 10,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default MainScreen;
