import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import QuizImage from '../assets/images/brazuca.png';
import {useLexicon} from '../context/LexiconContext';
import {useTheme} from '../context/ThemeContext';
import AddWordScreen from './AddWordScreen';

import {designSystem} from '../design';
import {categoryIcons, categoryColorsLight} from '../constants.js';

const MainScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
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

  const handleClose = () => setModalVisible(false);

  const filteredItems = lexicon.filter(item => {
    const matchesSearch =
      item.original.toLowerCase().includes(searchText.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

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
      ]}
      contentContainerStyle={{paddingBottom: 40}}>
      {/* Date Header */}
      <View style={styles.dateContainer}>
        <Text style={[styles.dateText, {color: isDarkMode ? '#AAA' : '#666'}]}>
          {new Date().getDate()}{' '}
          {new Date().toLocaleString('en-US', {month: 'long'})}
        </Text>
        <Text
          style={[
            styles.weekdayText,
            {color: isDarkMode ? textLight : textDark},
          ]}>
          {new Date().toLocaleString('en-US', {weekday: 'long'})}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: isDarkMode ? '#333' : '#F0F0F0',
            },
          ]}>
          <Ionicons
            name="search"
            size={20}
            color={isDarkMode ? '#aaa' : '#666'}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchBar,
              {
                color: isDarkMode ? textLight : textDark,
              },
            ]}
            placeholder="Search a word or phrase"
            placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {searchText.length > 0 && (
          <View
            style={[
              styles.dropdown,
              {backgroundColor: isDarkMode ? cardBackgroundDark : '#fff'},
            ]}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() =>
                    navigation.navigate('WordDetail', {word: item})
                  }>
                  <Text style={{color: isDarkMode ? textLight : textDark}}>
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
      {/* Quiz Section */}
      <TouchableOpacity
        style={[
          styles.quizCard,
          {backgroundColor: isDarkMode ? '#2a2a2a' : '#f4f4f4'},
        ]}
        onPress={navigateToQuizScreen}>
        <Image
          source={QuizImage}
          style={styles.quizImage}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.quizTitle,
              {color: isDarkMode ? textLight : '#1a1a1a'},
            ]}>
            Daily Challenge
          </Text>
          <Text
            style={[
              styles.quizSubtitle,
              {color: isDarkMode ? '#bbb' : '#555'},
            ]}>
            Test your memory and track your progress.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Categories */}
      <Text
        style={[
          styles.sectionTitle,
          {color: isDarkMode ? textLight : textDark},
        ]}>
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
            <Ionicons
              name={categoryIcons[category]}
              size={34}
              color={isDarkMode ? textLight : '#444'}
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

      {/* Add Word Modal */}
      <AddWordScreen isVisible={modalVisible} onClose={handleClose} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekdayText: {
    fontSize: 28,
    fontWeight: '600',
  },
  searchWrapper: {
    marginBottom: 20,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    elevation: 2,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    elevation: 4,
    padding: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCard: {
    width: '30%',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  quizCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
    minHeight: 180,
    marginBottom: 20
  },

  quizImage: {
    width: 160,
    height: 160,
  },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  quizTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
    flexWrap: 'wrap',
  },

  quizSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
});

export default MainScreen;
